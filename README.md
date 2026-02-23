# 💧 JalMitra — Integrated Drought Warning & Smart Tanker Management System

JalMitra is an advanced, data-driven platform designed to proactively manage water scarcity and optimize tanker distribution in drought-prone regions like **Vidarbha, Maharashtra**.

The system integrates real-time weather analytics, historical climate data, and smart allocation algorithms to ensure that water reaches those who need it most, efficiently and transparently.

## 🚀 Key Features

### 📡 Multi-API Weather Intelligence
Integrates four distinct weather APIs to provide a comprehensive drought profile:
- **Open-Meteo**: Real-time rainfall and 14-day forecasts.
- **NASA POWER**: 40-year scientific climate baselines and evapotranspiration data.
- **WeatherAPI.com**: Bulk data polling for all 11 Vidarbha districts and air quality alerts.
- **Visual Crossing**: Granular historical daily records and drought spell detection.

### 🧠 Smart Allocation & Routing
- **Water Stress Index (WSI)**: A proprietary algorithm calculating stress based on rainfall deficit, groundwater levels, and population demand.
- **Priority Scoring**: Automatically ranks villages most in need of emergency supply.
- **Route Optimizer**: Uses Google OR-Tools VRP solver to optimize tanker routes for minimum travel distance and time.

### 🌓 Modern Dual-Theme Interface
- **Command Center**: Real-time dashboard with animated charts, stats cards, and a live drought heatmap.
- **Village Portal**: Simplified interface for Gram Panchayat users to submit requests and track delivery.
- **Responsive Design**: Glassmorphic UI with full dark/light mode support.

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, Framer Motion, Recharts, Leaflet.js.
- **Backend**: Python FastAPI, SQLAlchemy, SQLite, APScheduler.
- **Algorithms**: Scikit-learn, OR-Tools, Time-series analysis.
- **Communication**: WebSocket for live updates, Twilio for WhatsApp driver integration.

## 📁 Repository Structure

```
jalmitra/
├── frontend/             # Next.js web application
│   ├── app/              # App router (dashboard, village portal, login)
│   ├── components/       # UI components (Sidebar, LiveBadge, etc.)
│   └── hooks/            # Real-time polling and WebSocket hooks
└── backend/              # FastAPI server & ML engine
    ├── app/
    │   ├── ml/           # WSI & Route optimization engines
    │   ├── services/     # Weather & mapping API integrations
    │   └── scheduler.py  # Background data refresh tasks
    └── data/             # Template CSVs for real Vidarbha data
```

## 🏁 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+

### Setup

1. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   python import_data.py  # Load initial Vidarbha data
   uvicorn main:app --reload --port 8000
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Visit `http://localhost:3000` to access the platform.

---
*Built for the Vidarbha Level Hackathon 2026. Empowering communities through smart water governance.*
