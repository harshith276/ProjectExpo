import asyncio
import random
from datetime import datetime
from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine, Base
from app.models.usage import UsageLog
from app.services.billing import VoltBilling

from app.api.auth import router as auth_router
from app.api.user import router as user_router
from app.api.appliances import router as app_router
from app.api.usage import router as usage_router
from app.api.ai import router as ai_router
from app.api.automations import router as automations_router

# REMOVED: currency_router - no longer needed (INR only app)

from app.database import Base, engine, test_connection

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://192.168.0.168:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from sqlalchemy import text

def run_migrations():
    db = SessionLocal()
    try:
        db.execute(text("ALTER TABLE users ADD COLUMN state VARCHAR"))
        db.commit()
    except Exception as e:
        db.rollback()
    try:
        db.execute(text("ALTER TABLE users ADD COLUMN monthly_unit_limit FLOAT"))
        db.commit()
    except Exception as e:
        db.rollback()
    try:
        db.execute(text("ALTER TABLE appliances ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 0"))
        db.commit()
    except Exception as e:
        db.rollback()
    finally:
        db.close()

@app.on_event("startup")
async def startup_event():
    # Run migrations
    run_migrations()
    # Create all tables
    Base.metadata.create_all(bind=engine)
    # Test connection
    if test_connection():
        print("[OK] Database ready!")
    else:
        print("[FAIL] Database connection failed!")
    # Start simulator background task
    asyncio.create_task(run_simulator_task())

# Exception Handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"}
    )

@app.get("/")
def home():
    return {
        "status": "VoltVision AI API is running. "
                  "Connect frontend via port 5174 or 3000."
    }

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(user_router, prefix="/api/user", tags=["user"])
app.include_router(app_router, prefix="/api/appliances", tags=["Appliances"])
app.include_router(usage_router, prefix="/api/usage", tags=["usage"])
app.include_router(ai_router, prefix="/api/ai", tags=["AI Assistant"])
app.include_router(automations_router, prefix="/api/automations", tags=["automations"])

# REMOVED: currency_router - INR only, no currency conversion needed

# INR electricity rate - average Indian rate ₹6 per kWh
INR_RATE_PER_KWH = 6.0
global_engine = VoltBilling(
    rate_per_unit=INR_RATE_PER_KWH,
    currency_symbol="₹"
)

from datetime import date
from app.models.user import User
from sqlalchemy import func
import json

# -----------------------------------------------------------
# WebSocket Connection Manager (broadcast pattern)
# -----------------------------------------------------------
import logging
logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"[WS Manager] Connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"[WS Manager] Disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: str):
        """Broadcast message to ALL connected clients"""
        if not self.active_connections:
            logger.debug("[WS Broadcast] No active connections")
            return
        
        disconnected = []
        for i, connection in enumerate(self.active_connections):
            try:
                await connection.send_text(message)
                logger.debug(f"[WS] Sent to client {i}")
            except Exception as e:
                logger.warning(f"[WS] Failed to send to client {i}: {e}")
                disconnected.append(connection)
        
        # Remove disconnected clients
        for conn in disconnected:
            self.disconnect(conn)

manager = ConnectionManager()

# -----------------------------------------------------------
# Smooth random-walk simulator (single source of truth)
# -----------------------------------------------------------
current_watts          = 500.0   # base random-walk value

async def run_simulator_task():
    global current_watts
    print("[Simulator] Started ✅")
    reading_count = 0

    from app.models.appliance import Appliance
    from app.models.automation import Automation

    while True:
        try:
            if random.random() < 0.7:
                change = random.uniform(-100, 100)
            else:
                change = random.uniform(-300, 300)

            current_watts = max(200, min(2000, current_watts + change))

            timestamp = datetime.utcnow()

            db = SessionLocal()
            try:
                active_users = db.query(User).all()

                if not active_users:
                    await asyncio.sleep(5)
                    continue

                first_user_watts = 0.0
                first_user_kwh_this_reading = 0.0

                # Save a usage log for each user based on their specific appliance load
                for idx, user in enumerate(active_users):
                    # Calculate active appliance load dynamically from DB
                    user_appliances = db.query(Appliance).filter(
                        Appliance.user_id == user.id, 
                        Appliance.is_active == True
                    ).all()
                    
                    active_appliance_watts = sum(app.watts for app in user_appliances)
                    user_total_watts = round(current_watts + active_appliance_watts, 2)
                    
                    # Evaluate Automations
                    automations = db.query(Automation).filter(
                        Automation.user_id == user.id, 
                        Automation.is_active == True
                    ).all()
                    
                    for auto in automations:
                        if user_total_watts > auto.threshold_watts:
                            target_app = db.query(Appliance).filter(Appliance.id == auto.target_appliance_id).first()
                            if target_app and target_app.is_active:
                                target_app.is_active = False
                                user_total_watts -= target_app.watts  # Reflect power drop immediately
                                db.commit()
                                print(f"[Automation] User {user.id}: Turned off {target_app.name} (Threshold: {auto.threshold_watts}W)")

                    # kWh consumed in this 5-second reading window
                    kwh_this_reading = user_total_watts * (5 / 3600) / 1000

                    usage_log = UsageLog(
                        user_id=user.id,
                        kwh_consumed=kwh_this_reading,
                        watts=user_total_watts,
                        recorded_at=timestamp,
                        date=timestamp.date()
                    )
                    db.add(usage_log)

                    # Keep track of the first user's values for broadcasting
                    if idx == 0:
                        first_user_watts = user_total_watts
                        first_user_kwh_this_reading = kwh_this_reading

                db.commit()

                # Calculate projected bill for FIRST user (representative)
                first_user = active_users[0]
                total_kwh_this_month = db.query(
                    func.sum(UsageLog.kwh_consumed)
                ).filter(
                    UsageLog.user_id == first_user.id,
                    UsageLog.date == timestamp.date()
                ).scalar() or 0.0

                # Project to 30 days from today's accumulated usage
                projected_monthly_kwh = total_kwh_this_month * 30

                # Bill = dynamically calculated using state slabs
                projected_bill_inr = global_engine.calculate_slab_bill(
                    units=projected_monthly_kwh, 
                    state=first_user.state
                )

                reading_count += 1

                # Broadcast rounded payload to all connected clients
                payload = json.dumps({
                    "current_watts": round(first_user_watts, 0),
                    "kwh_increment": round(first_user_kwh_this_reading, 6),
                    "total_kwh": round(total_kwh_this_month, 4),
                    "projected_bill_inr": projected_bill_inr,
                    "timestamp": timestamp.strftime("%H:%M:%S"),
                })

                print(f"[Sim] watts={round(first_user_watts,0)}W "
                      f"kwh={round(first_user_kwh_this_reading,6)} "
                      f"total={round(total_kwh_this_month,4)}kWh "
                      f"projected=₹{projected_bill_inr}")

                await manager.broadcast(payload)

            finally:
                db.close()

        except Exception as e:
            print(f"[Simulator] ❌ Error: {e}")

        await asyncio.sleep(5)

# -----------------------------------------------------------
# WebSocket endpoint
# -----------------------------------------------------------
@app.websocket("/ws/live-status")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for live status updates.
    Receives broadcast from simulator every 5s.
    """
    client_id = id(websocket)
    logger.info(f"[WS] Client {client_id} connecting...")
    
    try:
        await manager.connect(websocket)
        logger.info(f"[WS] Client {client_id} connected ✅")
        
        # Keep connection alive
        # Data arrives via broadcast from simulator
        while True:
            # Wait for any message (ping/pong)
            # This keeps the connection alive
            data = await websocket.receive_text()
            # Echo back or just ignore
            
    except WebSocketDisconnect:
        logger.warning(f"[WS] Client {client_id} disconnected")
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"[WS] Error with {client_id}: {e}")
        manager.disconnect(websocket)
