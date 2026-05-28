import httpx
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import date, datetime, timedelta
from collections import OrderedDict

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.usage import UsageLog
from app.models.appliance import Appliance
from app.services.billing import calculate_slab_bill

router = APIRouter()
CACHE_COOLDOWN = timedelta(minutes=5)
WATTS_MARGIN_RATIO = 0.05
MAX_WARNING_CACHE_ENTRIES = 256
_budget_warning_cache: "OrderedDict[int, Dict[str, Any]]" = OrderedDict()

class ChatRequest(BaseModel):
    message: str


def _is_within_watts_margin(current_watts: float, cached_watts: float) -> bool:
    if current_watts == cached_watts:
        return True
    baseline = max(abs(cached_watts), 1.0)
    return abs(current_watts - cached_watts) <= (baseline * WATTS_MARGIN_RATIO)


def _get_cached_budget_warning(user_id: int, active_watts: float, now: datetime) -> Optional[str]:
    cached = _budget_warning_cache.get(user_id)
    if not cached:
        return None

    if now - cached["timestamp"] > CACHE_COOLDOWN:
        _budget_warning_cache.pop(user_id, None)
        return None

    if not _is_within_watts_margin(active_watts, cached["active_watts"]):
        return None

    _budget_warning_cache.move_to_end(user_id)
    return cached["warning"]


def _store_budget_warning(user_id: int, active_watts: float, warning: str, now: datetime) -> None:
    _budget_warning_cache[user_id] = {
        "active_watts": float(active_watts),
        "warning": warning,
        "timestamp": now,
    }
    _budget_warning_cache.move_to_end(user_id)
    while len(_budget_warning_cache) > MAX_WARNING_CACHE_ENTRIES:
        _budget_warning_cache.popitem(last=False)


@router.get("/budget-warning", response_model=Dict[str, Any])
async def get_budget_warning(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        budget = float(current_user.budget or 0.0)
        active_watts = db.query(func.sum(Appliance.watts)).filter(
            Appliance.user_id == current_user.id,
            Appliance.is_active == True
        ).scalar() or 0.0

        kwh = (float(active_watts) / 1000) * 24 * 30
        projected = round(calculate_slab_bill(kwh), 2)

        if projected <= budget:
            return {"warning": None}

        now = datetime.utcnow()
        cached_warning = _get_cached_budget_warning(current_user.id, float(active_watts), now)
        if cached_warning:
            return {"warning": cached_warning}

        prompt = (
            f"Budget ₹{budget}, projected bill ₹{projected}. "
            f"Write 1 urgent witty warning under 15 words."
        )

        ollama_url = "http://127.0.0.1:11434/api/generate"
        payload = {
            "model": "qwen2.5-coder:1.5b",
            "prompt": prompt,
            "stream": False
        }

        async with httpx.AsyncClient(timeout=None) as client:
            response = await client.post(ollama_url, json=payload)
            response.raise_for_status()
            data = response.json()
            warning = (data.get("response", "") or "").strip()
            if warning:
                _store_budget_warning(current_user.id, float(active_watts), warning, now)
            return {"warning": warning or None}

    except Exception as e:
        print(f"AI budget warning error: {type(e).__name__} - {str(e)}")
        return {"warning": None}

# NOTE: This endpoint is intentionally stateless.
# No chat messages are written to the database — every call is independent.
@router.post("/chat", response_model=Dict[str, Any])
async def chat_with_ai(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # 1. Gather context — budget
        budget = current_user.budget

        # 2. Calculate total kWh consumed this month
        today = date.today()
        start_of_month = today.replace(day=1)

        total_kwh = db.query(func.sum(UsageLog.kwh_consumed)).filter(
            UsageLog.user_id == current_user.id,
            func.date(UsageLog.recorded_at) >= start_of_month
        ).scalar() or 0.0

        total_kwh = round(total_kwh, 2)
        current_bill_amount = calculate_slab_bill(total_kwh)

        # 3. Fetch currently active appliances from the database
        active_appliances = db.query(Appliance).filter(
            Appliance.user_id == current_user.id,
            Appliance.is_active == True
        ).all()

        if active_appliances:
            active_names = ", ".join(a.name for a in active_appliances)
            active_watts = sum(a.watts for a in active_appliances)
            appliance_context = (
                f"The user currently has these appliances turned ON: {active_names} "
                f"(total active load: {active_watts}W). "
            )
        else:
            appliance_context = "The user currently has no appliances turned ON. "

        # 4. Construct the prompt with full context
        prompt = (
            f"You are Volt, a highly advanced and concise home energy advisor. "
            f"The user's monthly budget is \u20b9{budget} and they have consumed {total_kwh} kWh so far this month. "
            f"Based on state slab tariffs, their current bill is estimated at \u20b9{current_bill_amount}. "
            f"{appliance_context}"
            f"The user asks: {request.message}\n\n"
            f"CRITICAL RULES FOR YOUR RESPONSE:\n"
            f"1. Be extremely concise, conversational, and direct.\n"
            f"2. Never use more than 2 or 3 short bullet points.\n"
            f"3. Do not write introductory or concluding essays. Give the answer immediately."
        )

        # 5. Send request to local Ollama (no response stored in DB — stateless)
        ollama_url = "http://127.0.0.1:11434/api/generate"
        payload = {
            "model": "qwen2.5-coder:1.5b",
            "prompt": prompt,
            "stream": False
        }

        async with httpx.AsyncClient(timeout=None) as client:
            response = await client.post(ollama_url, json=payload)
            response.raise_for_status()
            data = response.json()
            return {"response": data.get("response", "I'm sorry, I couldn't generate a response.")}

    except Exception as e:
        error_msg = f"Diagnostic Error: {type(e).__name__} - {str(e)}"
        print(f"CRITICAL AI ERROR: {error_msg}")
        return {"response": error_msg}
