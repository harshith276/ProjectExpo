import time
import random
from app.database import SessionLocal, engine, Base
from app.models.usage import UsageLog

Base.metadata.create_all(bind=engine)

def run_simulator():
    print("🚀 VoltVision Live Simulator Started...")
    db = SessionLocal()
    total_units = 0.0

    try:
        while True:
            # Generate random wattage
            wattage = round(random.uniform(150, 2000), 2)
            
            # Simple math for units (kWh)
            added_units = (wattage * (5/3600)) / 1000
            total_units += added_units

            # Save to PostgreSQL
            new_log = UsageLog(wattage=wattage, units_consumed=round(total_units, 4))
            db.add(new_log)
            db.commit()

            print(f"📡 Pulse: {wattage}W | Total: {round(total_units, 4)} kWh")
            time.sleep(5)
    except KeyboardInterrupt:
        print("\n🛑 Stopped.")
    finally:
        db.close()

if __name__ == "__main__":
    run_simulator()