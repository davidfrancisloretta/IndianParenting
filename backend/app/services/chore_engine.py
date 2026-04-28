from datetime import date, datetime, timedelta

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models import Approval, ApprovalDecision, Child, Chore, DailyLog, LogStatus, Payout, PayoutStatus, User
from app.schemas import ChoreCreate, ChoreUpdate
from app.services.scoring import calculate_points


def start_of_week(day: date) -> date:
    return day - timedelta(days=day.weekday())


def week_range(day: date) -> tuple[date, date]:
    start = start_of_week(day)
    return start, start + timedelta(days=6)


def visible_chores(db: Session, family_id: str) -> list[Chore]:
    stmt = (
        select(Chore)
        .where(Chore.is_active.is_(True))
        .where(or_(Chore.family_id.is_(None), Chore.family_id == family_id))
        .order_by(Chore.category, Chore.time_slot, Chore.name)
    )
    return list(db.scalars(stmt))


def create_custom_chore(db: Session, family_id: str, payload: ChoreCreate) -> Chore:
    chore = Chore(family_id=family_id, **payload.model_dump())
    db.add(chore)
    db.commit()
    db.refresh(chore)
    return chore


def update_chore(db: Session, family_id: str, chore_id: str, payload: ChoreUpdate) -> Chore:
    chore = db.scalar(
        select(Chore).where(
            Chore.id == chore_id,
            or_(Chore.family_id.is_(None), Chore.family_id == family_id),
        )
    )
    if not chore:
        raise ValueError("Chore not found for this family")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(chore, field, value)

    db.commit()
    db.refresh(chore)
    return chore


def ensure_daily_logs(db: Session, family_id: str, child_id: str, log_date: date) -> list[DailyLog]:
    child = db.get(Child, child_id)
    if not child or child.family_id != family_id:
        raise ValueError("Child not found for this family")

    chores = visible_chores(db, family_id)
    existing = {
        log.chore_id: log
        for log in db.scalars(
            select(DailyLog)
            .where(DailyLog.family_id == family_id, DailyLog.child_id == child_id, DailyLog.log_date == log_date)
            .options(joinedload(DailyLog.chore))
        )
    }
    for chore in chores:
        if chore.id not in existing:
            db.add(DailyLog(family_id=family_id, child_id=child_id, chore_id=chore.id, log_date=log_date))
    db.commit()
    return list(
        db.scalars(
            select(DailyLog)
            .where(DailyLog.family_id == family_id, DailyLog.child_id == child_id, DailyLog.log_date == log_date)
            .options(joinedload(DailyLog.chore))
            .order_by(DailyLog.log_date, DailyLog.chore_id)
        )
    )


def submit_log(db: Session, family_id: str, log_id: str, value: int | None, note: str | None) -> DailyLog:
    log = db.scalar(
        select(DailyLog).where(DailyLog.id == log_id, DailyLog.family_id == family_id).options(joinedload(DailyLog.chore))
    )
    if not log:
        raise ValueError("Daily log not found")
    log.status = LogStatus.SUBMITTED
    log.submitted_value = value
    log.note = note
    log.submitted_at = datetime.utcnow()
    log.points_awarded = 0
    db.commit()
    db.refresh(log)
    return log


def review_log(db: Session, parent: User, log_id: str, approved: bool, value: int | None, note: str | None) -> DailyLog:
    log = db.scalar(
        select(DailyLog)
        .where(DailyLog.id == log_id, DailyLog.family_id == parent.family_id)
        .options(joinedload(DailyLog.chore))
    )
    if not log:
        raise ValueError("Daily log not found")

    decision = ApprovalDecision.APPROVED if approved else ApprovalDecision.REJECTED
    log.status = LogStatus.APPROVED if approved else LogStatus.REJECTED
    log.reviewed_at = datetime.utcnow()
    if approved:
        points, approved_value = calculate_points(log.chore, value if value is not None else log.submitted_value)
        log.points_awarded = points
        log.approved_value = approved_value
    else:
        log.points_awarded = 0
        log.approved_value = None

    db.add(Approval(daily_log_id=log.id, parent_id=parent.id, decision=decision, note=note))
    db.commit()
    db.refresh(log)
    return log


def pending_logs(db: Session, family_id: str) -> list[DailyLog]:
    return list(
        db.scalars(
            select(DailyLog)
            .where(DailyLog.family_id == family_id, DailyLog.status == LogStatus.SUBMITTED)
            .options(joinedload(DailyLog.chore), joinedload(DailyLog.child))
            .order_by(DailyLog.submitted_at.desc())
        )
    )


def weekly_points(db: Session, family_id: str, child_id: str, week_start: date) -> int:
    week_end = week_start + timedelta(days=6)
    return int(
        db.scalar(
            select(func.coalesce(func.sum(DailyLog.points_awarded), 0)).where(
                DailyLog.family_id == family_id,
                DailyLog.child_id == child_id,
                DailyLog.log_date >= week_start,
                DailyLog.log_date <= week_end,
                DailyLog.status == LogStatus.APPROVED,
            )
        )
        or 0
    )


def live_weekly_payouts(db: Session, family_id: str, day: date) -> list[dict]:
    start, end = week_range(day)
    children = db.scalars(select(Child).where(Child.family_id == family_id).order_by(Child.name)).all()
    family_rate = children[0].family.point_to_rupee_rate if children else 1
    payouts = []
    for child in children:
        points = weekly_points(db, family_id, child.id, start)
        payouts.append(
            {
                "child_id": child.id,
                "child_name": child.name,
                "week_start": start,
                "week_end": end,
                "total_points": points,
                "rupees": points * family_rate,
                "status": "LIVE",
            }
        )
    return payouts


def finalize_payout(db: Session, family_id: str, child_id: str, week_start: date) -> Payout:
    child = db.get(Child, child_id)
    if not child or child.family_id != family_id:
        raise ValueError("Child not found for this family")
    week_end = week_start + timedelta(days=6)
    points = weekly_points(db, family_id, child_id, week_start)
    rupees = points * child.family.point_to_rupee_rate
    payout = db.scalar(select(Payout).where(Payout.child_id == child_id, Payout.week_start == week_start))
    if payout is None:
        payout = Payout(family_id=family_id, child_id=child_id, week_start=week_start, week_end=week_end)
        db.add(payout)
    payout.total_points = points
    payout.rupees = rupees
    payout.status = PayoutStatus.FINALIZED
    payout.finalized_at = datetime.utcnow()
    db.commit()
    db.refresh(payout)
    return payout
