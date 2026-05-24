# TradeView 📈

AI-powered Indian stock trading platform — real-time charts, option chain, AI signals, paper trading, and automated buy/sell strategies.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15, TypeScript, App Router |
| UI | Tailwind CSS, ShadCN UI, Framer Motion |
| State | Zustand, TanStack Query |
| Charts | TradingView Charting Library, Lightweight Charts |
| Backend | Next.js API Routes + Server Actions |
| AI/ML | FastAPI, XGBoost, LightGBM, LSTM, CNN, FinBERT |
| Database | Supabase (PostgreSQL) |
| Realtime | Socket.IO, Redis |
| Broker | Kite Connect (Zerodha) |
| Auth | Supabase Auth |

## Quick Start

### Prerequisites
- Node.js 20+, pnpm 9+
- Python 3.11+
- Docker Desktop
- Supabase CLI (`brew install supabase/tap/supabase`)

### 1. Install dependencies
```bash
pnpm install
```

### 2. Environment setup
```bash
cp .env.example apps/web/.env.local
cp .env.example socket-server/.env
cp .env.example apps/ai-backend/.env
# Fill in your Supabase, Kite Connect credentials
```

### 3. Start Redis
```bash
docker compose up -d
```

### 4. Set up Supabase
```bash
supabase init
supabase start
supabase db push
```

### 5. Install Python deps
```bash
cd apps/ai-backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 6. Run all services

```bash
# Terminal 1 — Next.js frontend (:3000)
pnpm --filter web dev

# Terminal 2 — FastAPI AI backend (:8000)
cd apps/ai-backend && uvicorn app.main:app --reload --port 8000

# Terminal 3 — Socket.IO realtime server (:4000)
pnpm --filter socket-server dev

# Terminal 4 — Redis (already running via Docker)
```

## Features

- 🔐 **Auth** — Supabase email + OAuth login
- 📊 **Live Charts** — TradingView + Lightweight Charts with AI signal overlays
- 👁 **Watchlist** — Real-time price updates via WebSocket
- 🔗 **Option Chain** — Live OI, IV, Greeks
- 🤖 **AI Signals** — XGBoost/LSTM predictions with confidence scores
- 📋 **Paper Trading** — Virtual order execution with P&L tracking
- ⚡ **Auto-Trade** — Automated buy/sell engine (profit target + stop-loss + AI signals)
- 💼 **Portfolio** — Real broker holdings via Kite Connect

## Auto-Trade Safety

- New strategies default to `paper` mode — you must explicitly enable `real` mode
- Daily loss circuit breaker auto-disables all strategies
- Minimum 60% AI confidence required to enter a trade
- All executions logged to `auto_trade_executions` table
