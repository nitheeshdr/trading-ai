from fastapi import APIRouter
from app.schemas.risk import RiskRequest, RiskResponse
from app.api.risk import score_risk

router = APIRouter()


@router.post("/score", response_model=RiskResponse)
async def score_portfolio(req: RiskRequest):
    """Alias of risk scoring for portfolio health."""
    return await score_risk(req)
