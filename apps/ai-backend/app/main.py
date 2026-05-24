from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import signals, sentiment, patterns, risk, portfolio, auto_signal
from loguru import logger

app = FastAPI(
    title="TradeView AI API",
    version="0.1.0",
    description="AI/ML backend for TradeView — signals, sentiment, patterns, risk scoring",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(signals.router,     prefix="/signals",      tags=["Signals"])
app.include_router(sentiment.router,   prefix="/sentiment",    tags=["Sentiment"])
app.include_router(patterns.router,    prefix="/patterns",     tags=["Patterns"])
app.include_router(risk.router,        prefix="/risk",         tags=["Risk"])
app.include_router(portfolio.router,   prefix="/portfolio",    tags=["Portfolio"])
app.include_router(auto_signal.router, prefix="/auto-signal",  tags=["Auto-Signal"])


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.on_event("startup")
async def startup():
    logger.info("TradeView AI backend starting up…")
