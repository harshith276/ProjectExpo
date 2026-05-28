from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
from typing import Dict, Any

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.usage import UsageLog
from sqlalchemy import func

router = APIRouter()

@router.get("/daily", response_model=Dict[str, Any])
async def get_daily_usage(
   current_user: User = Depends(get_current_user),
   db: Session = Depends(get_db)
):
    # Get last 7 days dates
    today = date.today()
    last_7_days = [today - timedelta(days=i) for i in range(6, -1, -1)]
    
    # Query REAL usage for THIS user only
    results = db.query(
        func.date(UsageLog.recorded_at).label("date"),
        func.sum(UsageLog.kwh_consumed).label("total_kwh")
    ).filter(
        UsageLog.user_id == current_user.id,
        func.date(UsageLog.recorded_at) >= today - timedelta(days=7)
    ).group_by(
        func.date(UsageLog.recorded_at)
    ).all()
    
    # Map real results to dates
    usage_map = {str(r.date): round(r.total_kwh, 6) for r in results if r.total_kwh is not None}
    
    # Return 0.0 for days with no real data
    labels = [d.strftime("%a %d %b") for d in last_7_days]
    data = [usage_map.get(str(d), 0.0) for d in last_7_days]
    has_data = any(v > 0 for v in data)
    
    print(f"Daily usage for {current_user.email}: {usage_map}")
    
    return {
        "labels": labels,
        "data": data,
        "has_data": has_data,
        "total_kwh_today": usage_map.get(str(today), 0.0),
        "message": "No usage recorded yet" if not has_data else "Real usage data"
    }

@router.get("/weekly", response_model=Dict[str, Any])
async def get_weekly_usage(
   current_user: User = Depends(get_current_user),
   db: Session = Depends(get_db)
):
    today = date.today()
    # Let's map back 4 weeks
    labels = []
    data = []
    
    for i in range(3, -1, -1):
        week_start = today - timedelta(days=today.weekday()) - timedelta(weeks=i)
        week_end = week_start + timedelta(days=6)
        
        # Calculate sum for this week specifically
        weekly_sum = db.query(func.sum(UsageLog.kwh_consumed)).filter(
            UsageLog.user_id == current_user.id,
            func.date(UsageLog.recorded_at) >= week_start,
            func.date(UsageLog.recorded_at) <= week_end
        ).scalar()
        
        labels.append(f"Week {i} Ago" if i > 0 else "This Week")
        data.append(round(weekly_sum, 3) if weekly_sum else 0.0)
        
    return {
        "labels": labels,
        "data": data,
        "has_data": any(v > 0 for v in data),
        "message": "No usage recorded yet" if not any(v > 0 for v in data) else "Real usage data"
    }

@router.get("/analytics", response_model=Dict[str, Any])
async def get_analytics_usage(
   current_user: User = Depends(get_current_user),
   db: Session = Depends(get_db)
):
    today = date.today()
    
    # --- Daily Usage (Last 7 days) ---
    last_7_days = [today - timedelta(days=i) for i in range(6, -1, -1)]
    
    daily_results = db.query(
        func.date(UsageLog.recorded_at).label("date"),
        func.sum(UsageLog.kwh_consumed).label("total_kwh")
    ).filter(
        UsageLog.user_id == current_user.id,
        func.date(UsageLog.recorded_at) >= today - timedelta(days=7)
    ).group_by(
        func.date(UsageLog.recorded_at)
    ).all()
    
    daily_usage_map = {str(r.date): round(r.total_kwh, 4) for r in daily_results if r.total_kwh is not None}
    
    # Clean labels like "Mon 24"
    daily_labels = [d.strftime("%a %d") for d in last_7_days]
    daily_data = [daily_usage_map.get(str(d), 0.0) for d in last_7_days]

    # --- Weekly Trends (Last 4 weeks) ---
    weekly_labels = []
    weekly_data = []
    
    for i in range(3, -1, -1):
        week_start = today - timedelta(days=today.weekday()) - timedelta(weeks=i)
        week_end = week_start + timedelta(days=6)
        
        weekly_sum = db.query(func.sum(UsageLog.kwh_consumed)).filter(
            UsageLog.user_id == current_user.id,
            func.date(UsageLog.recorded_at) >= week_start,
            func.date(UsageLog.recorded_at) <= week_end
        ).scalar()
        
        # Clean labels like "Week 1", "Week 2", "Week 3", "Week 4"
        weekly_labels.append(f"Week {4-i}")
        weekly_data.append(round(weekly_sum, 4) if weekly_sum else 0.0)

    return {
        "daily": {
            "labels": daily_labels,
            "data": daily_data
        },
        "weekly": {
            "labels": weekly_labels,
            "data": weekly_data
        }
    }
