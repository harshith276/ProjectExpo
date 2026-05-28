<<<<<<< HEAD
# VoltVision AI

VoltVision AI is a real-time power grid monitoring, cost projection, and virtual appliance simulation web application.

## Overview
It integrates a robust real-time backend engine generating automated telemetry, an embedded FastAPI web socket channel that pipes wattage datastreams and cost-projections natively, and an aesthetically premium React/Vite dashboard enabling users to track expenses and control virtual devices dynamically.

## Architecture

```text
CLIENT (Browser)                 BACKEND (FastAPI - Port 8000)             DATABASE (Port 5432)
   |                                 ^                                       |
   |                                 |                                       V
   |----(Websockets /ws/ )---------->| (Async background sim process) ---> (PostgreSQL)
   |                                 |                                       |
   |-----(REST /api/ )-------------->| <------(SQLAlchemy ORM)---------------+
   V                                 V                                       |
(React 19 Dashboard)              (User/Auth/Usage/Appliances logic)         V
(Axios Interceptor for           <-(JWT Refresh/Access Tokens)          (Refresh Tokens/Logs)
 Access Rotation + Settings)     <-(External Live Currency Fetching)  
```

## Setup Instructions

### Environment Setup

1. Copy `.env.example` in the `backend/` directory to `.env` and fill out the security settings:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Navigate into `frontend/` and configure the UI environments by ensuring an `.env` exists:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   VITE_WS_BASE_URL=ws://localhost:8000
   ```

### Docker Implementation (Recommended)

To deploy the entire environment (Frontend Nginx, Backend Uvicorn, and PostgreSQL Engine) sequentially:
```bash
docker-compose up --build -d
```
All endpoints map directly. Visit `http://localhost:3000` to interact.

### Local Development Setup

**Backend**:
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
*(Ensure `backend/.env` links to PostgreSQL if active, or SQLite `sqlite:///./voltvision.db`)*

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```

## API Reference

### Authentication (`/api/auth`)
- `POST /signup`: Registers email and password returning the User.
- `POST /login`: Issues initial `access_token` and bound `refresh_token`.
- `POST /refresh`: Revokes and replaces expiring access tokens silently.

### User Account (`/api/user`)
- `GET /profile`: Captures JWT sub identifying standard profile.
- `PUT /profile`: Patches global email and display logic.
- `PUT /budget`: Updates the threshold trigger constraint.
- `PUT /currency`: Flips USD to INR rendering context.

### Appliance Simulator (`/api/appliances`)
- `GET /`: Dumps array of internal mapped components.
- `POST /custom`: Pushes customized elements into UI mapping.
- `DELETE /{id}`: Clears mapped custom components bounds.

### Telemetry & Charting (`/ws/live-status`, `/api/usage`)
- `WS /ws/live-status`: Opens bi-directional stream returning `current_watts` and `total_kwh`.
- `GET /api/usage/daily`: Aggregation bucket of trailing 7 days.
- `GET /api/usage/weekly`: Aggregation bucket of trailing 4 weeks.

### External Providers (`/api/currency`)
- `GET /api/currency/rate?from=USD&to=INR`: Resolves FrankFurter API live quotes with memory expiration layers.
=======
# ProjectExpo
>>>>>>> 05de0ecebf6ab0c952a84670e9d2e466fc2b1bc5
