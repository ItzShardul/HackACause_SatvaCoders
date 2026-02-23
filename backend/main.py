"""
JalMitra Backend — FastAPI Application
Integrated Drought Warning & Smart Tanker Management System
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base, SessionLocal
from app.routes import router
from app.weather_routes import weather_router
from app.seed_data import seed_database
from app.websocket import manager
from app.scheduler import start_scheduler, stop_scheduler, initial_data_load


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    # Start background weather scheduler
    start_scheduler()

    # Initial weather data load (non-blocking)
    import asyncio
    asyncio.create_task(initial_data_load())

    yield

    # Shutdown
    stop_scheduler()


app = FastAPI(
    title="JalMitra API",
    description="Integrated Drought Warning & Smart Tanker Management System — Vidarbha Region",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(router)
app.include_router(weather_router)


@app.get("/")
def root():
    return {
        "name": "JalMitra API v2",
        "version": "2.0.0",
        "description": "Drought Warning & Tanker Management — Vidarbha Region",
        "weather_apis": ["Open-Meteo (live)", "NASA POWER (historical)", "Visual Crossing (daily)", "WeatherAPI (bulk+AQI)"],
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "healthy", "scheduler": "running"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    await manager.send_personal(
        {"type": "connected", "data": {"message": "JalMitra live feed connected — 4 weather APIs active"}},
        websocket
    )
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await manager.send_personal({"type": "pong", "data": {}}, websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
