from fastapi import APIRouter, HTTPException
import httpx
from datetime import datetime, timedelta
from app.core.config import settings

router = APIRouter()

# Memory cache
currency_cache = {}

@router.get("/rate")
async def get_currency_rate(from_curr: str = "USD", to_curr: str = "INR"):
    cache_key = f"{from_curr}_{to_curr}"
    
    # Check cache
    if cache_key in currency_cache:
        cached_data = currency_cache[cache_key]
        if datetime.utcnow() < cached_data['expires_at']:
            return {"from": from_curr, "to": to_curr, "rate": cached_data['rate'], "cached_at": cached_data['cached_at']}
            
    # Fetch from Frankfurter API
    url = f"https://api.frankfurter.app/latest?from={from_curr}&to={to_curr}"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            
            rate = data['rates'].get(to_curr)
            if not rate:
                raise HTTPException(status_code=400, detail="Target currency not found in API response")
                
            # Update cache
            now = datetime.utcnow()
            currency_cache[cache_key] = {
                "rate": rate,
                "cached_at": now.isoformat(),
                "expires_at": now + timedelta(minutes=settings.CURRENCY_CACHE_MINUTES)
            }
            
            return {"from": from_curr, "to": to_curr, "rate": rate, "cached_at": now.isoformat()}
    except Exception as e:
        # Graceful fallback or error logic
        raise HTTPException(status_code=502, detail=f"Error fetching live rate: {str(e)}")
