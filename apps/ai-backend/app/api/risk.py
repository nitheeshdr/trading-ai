from fastapi import APIRouter
from app.schemas.risk import RiskRequest, RiskResponse

router = APIRouter()


@router.post("/score", response_model=RiskResponse)
async def score_risk(req: RiskRequest):
    if not req.holdings:
        return RiskResponse(score=100.0, risk_level="low", recommendations=[])

    total_value = sum(h.quantity * h.current_price for h in req.holdings)
    recommendations = []

    # Concentration check
    for h in req.holdings:
        weight = (h.quantity * h.current_price) / total_value * 100
        if weight > 30:
            recommendations.append(f"{h.symbol} is {weight:.0f}% of portfolio — consider reducing")

    # P&L check
    losers = [h for h in req.holdings if h.current_price < h.avg_price]
    if len(losers) > len(req.holdings) * 0.6:
        recommendations.append("More than 60% of holdings are in loss — review your positions")

    score = max(0, 100 - len(recommendations) * 15 - len(losers) * 5)
    risk_level = "low" if score >= 70 else "medium" if score >= 40 else "high"

    return RiskResponse(score=float(score), risk_level=risk_level, recommendations=recommendations)
