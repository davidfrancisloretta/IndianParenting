from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Child, DailyLog, LogStatus
from app.services.chore_engine import visible_chores


PERIOD_DAYS = {
    "weekly": 7,
    "monthly": 30,
    "quarterly": 90,
    "half_yearly": 182,
    "yearly": 365,
}


def _rate(numerator: int, denominator: int) -> float:
    if denominator == 0:
        return 0.0
    return round((numerator / denominator) * 100, 1)


def _period_start(period: str, end_date: date) -> date:
    days = PERIOD_DAYS.get(period, PERIOD_DAYS["weekly"])
    return end_date - timedelta(days=days - 1)


def _trend_buckets(logs: list[DailyLog], start_date: date, end_date: date) -> list[dict]:
    total_days = max(1, (end_date - start_date).days + 1)
    bucket_count = 7 if total_days <= 7 else 6
    bucket_size = max(1, total_days // bucket_count)
    buckets = []

    current = start_date
    while current <= end_date:
        bucket_end = min(end_date, current + timedelta(days=bucket_size - 1))
        bucket_logs = [log for log in logs if current <= log.log_date <= bucket_end]
        total = len(bucket_logs)
        submitted = sum(1 for log in bucket_logs if log.status in {LogStatus.SUBMITTED, LogStatus.APPROVED})
        approved = sum(1 for log in bucket_logs if log.status == LogStatus.APPROVED)
        points = sum(log.points_awarded for log in bucket_logs if log.status == LogStatus.APPROVED)
        buckets.append(
            {
                "label": f"{current.isoformat()} to {bucket_end.isoformat()}",
                "start_date": current,
                "end_date": bucket_end,
                "completion_rate": _rate(submitted, total),
                "approval_rate": _rate(approved, submitted),
                "points": points,
            }
        )
        current = bucket_end + timedelta(days=1)

    return buckets


def _insight(chore_name: str, completion_rate: float, approval_rate: float, points: int) -> str:
    if completion_rate >= 80 and approval_rate >= 80:
        return f"Strong pattern: {chore_name} is being completed and approved consistently."
    if completion_rate < 40:
        return f"Needs attention: {chore_name} is often not submitted."
    if approval_rate < 60:
        return f"Review quality: {chore_name} is submitted but not consistently approved."
    if points > 0:
        return f"Improving: {chore_name} is generating approved points."
    return f"Watch this chore: {chore_name} has limited activity in this period."


def child_analytics(db: Session, family_id: str, child_id: str, period: str, end_date: date | None = None) -> dict:
    child = db.get(Child, child_id)
    if not child or child.family_id != family_id:
        raise ValueError("Child not found for this family")

    safe_period = period if period in PERIOD_DAYS else "weekly"
    end = end_date or date.today()
    start = _period_start(safe_period, end)
    logs = list(
        db.scalars(
            select(DailyLog).where(
                DailyLog.family_id == family_id,
                DailyLog.child_id == child_id,
                DailyLog.log_date >= start,
                DailyLog.log_date <= end,
            )
        )
    )
    logs_by_chore = {}
    for log in logs:
        logs_by_chore.setdefault(log.chore_id, []).append(log)

    chore_rows = []
    for chore in visible_chores(db, family_id):
        chore_logs = logs_by_chore.get(chore.id, [])
        total = len(chore_logs)
        submitted = sum(1 for log in chore_logs if log.status in {LogStatus.SUBMITTED, LogStatus.APPROVED})
        approved = sum(1 for log in chore_logs if log.status == LogStatus.APPROVED)
        rejected = sum(1 for log in chore_logs if log.status == LogStatus.REJECTED)
        points = sum(log.points_awarded for log in chore_logs if log.status == LogStatus.APPROVED)
        values = [log.approved_value for log in chore_logs if log.approved_value is not None]
        completion_rate = _rate(submitted, total)
        approval_rate = _rate(approved, submitted)
        average_value = round(sum(values) / len(values), 1) if values else None
        chore_rows.append(
            {
                "chore_id": chore.id,
                "chore_name": chore.name,
                "category": chore.category.value,
                "type": chore.type.value,
                "total_logs": total,
                "submitted": submitted,
                "approved": approved,
                "rejected": rejected,
                "points": points,
                "completion_rate": completion_rate,
                "approval_rate": approval_rate,
                "average_value": average_value,
                "insight": _insight(chore.name, completion_rate, approval_rate, points),
            }
        )

    active_rows = [row for row in chore_rows if row["total_logs"] > 0]
    strengths = sorted(active_rows, key=lambda row: (row["approval_rate"], row["completion_rate"], row["points"]), reverse=True)[:5]
    focus_areas = sorted(active_rows, key=lambda row: (row["completion_rate"], row["approval_rate"], row["points"]))[:5]
    total_logs = len(logs)
    submitted = sum(1 for log in logs if log.status in {LogStatus.SUBMITTED, LogStatus.APPROVED})
    approved = sum(1 for log in logs if log.status == LogStatus.APPROVED)
    total_points = sum(log.points_awarded for log in logs if log.status == LogStatus.APPROVED)

    if total_logs == 0:
        summary = [
            "No behavior data exists for this period yet.",
            "Open the child profile daily so chores are generated and tracked.",
            "Start with weekly tracking before making point changes.",
        ]
    else:
        best = strengths[0]["chore_name"] if strengths else "approved chores"
        weakest = focus_areas[0]["chore_name"] if focus_areas else "low-completion chores"
        summary = [
            f"{child.name}'s strongest current behavior is around {best}.",
            f"The main coaching opportunity is {weakest}.",
            f"This period has {total_points} approved points with {_rate(approved, submitted)}% approval on submitted chores.",
        ]

    return {
        "child": child,
        "period": safe_period,
        "start_date": start,
        "end_date": end,
        "total_points": total_points,
        "total_logs": total_logs,
        "completion_rate": _rate(submitted, total_logs),
        "approval_rate": _rate(approved, submitted),
        "strengths": strengths,
        "focus_areas": focus_areas,
        "trend": _trend_buckets(logs, start, end),
        "ai_summary": summary,
        "chores": sorted(chore_rows, key=lambda row: (row["category"], row["chore_name"])),
    }
