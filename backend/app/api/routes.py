from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.core.security import create_access_token, get_current_user, verify_password
from app.db.session import get_db
from app.models import Child, DailyLog, Family, LogStatus, User
from app.schemas import (
    AnalyticsOut,
    ChildOut,
    ChoreCreate,
    ChoreOut,
    ChoreUpdate,
    DailyLogOut,
    DashboardOut,
    FinalizePayoutIn,
    LoginIn,
    ReviewLogIn,
    SubmitLogIn,
    TokenOut,
    WeeklyPayoutOut,
)
from app.services.analytics import child_analytics
from app.services.chore_engine import (
    create_custom_chore,
    ensure_daily_logs,
    finalize_payout,
    live_weekly_payouts,
    pending_logs,
    review_log,
    start_of_week,
    submit_log,
    update_chore,
    visible_chores,
    weekly_points,
)

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/auth/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)) -> TokenOut:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return TokenOut(access_token=create_access_token(user))


@router.get("/me")
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    family = db.get(Family, current_user.family_id)
    children = db.scalars(select(Child).where(Child.family_id == current_user.family_id).order_by(Child.name)).all()
    return {
        "user": {"id": current_user.id, "email": current_user.email, "role": current_user.role.value},
        "family": {
            "id": family.id,
            "name": family.name,
            "point_to_rupee_rate": family.point_to_rupee_rate,
        },
        "children": [
            {"id": child.id, "name": child.name, "avatar_color": child.avatar_color}
            for child in children
        ],
    }


@router.get("/dashboard", response_model=DashboardOut)
def dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> DashboardOut:
    family = db.get(Family, current_user.family_id)
    children = db.scalars(select(Child).where(Child.family_id == current_user.family_id).order_by(Child.name)).all()
    week = start_of_week(date.today())
    weekly_totals = {child.name: weekly_points(db, current_user.family_id, child.id, week) for child in children}
    leaderboard = [
        {"child_id": child.id, "name": child.name, "points": weekly_totals[child.name], "rank": index + 1}
        for index, child in enumerate(sorted(children, key=lambda child: weekly_totals[child.name], reverse=True))
    ]
    pending_count = db.scalar(
        select(func.count(DailyLog.id)).where(
            DailyLog.family_id == current_user.family_id,
            DailyLog.status == LogStatus.SUBMITTED,
        )
    )
    return DashboardOut(
        family=family,
        children=children,
        pending_approvals=pending_count or 0,
        weekly_totals=weekly_totals,
        leaderboard=leaderboard,
    )


@router.get("/children", response_model=list[ChildOut])
def children(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[Child]:
    return list(db.scalars(select(Child).where(Child.family_id == current_user.family_id).order_by(Child.name)))


@router.get("/chores", response_model=list[ChoreOut])
def chores(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return visible_chores(db, current_user.family_id)


@router.post("/chores", response_model=ChoreOut)
def add_chore(payload: ChoreCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return create_custom_chore(db, current_user.family_id, payload)


@router.patch("/chores/{chore_id}", response_model=ChoreOut)
def edit_chore(
    chore_id: str,
    payload: ChoreUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return update_chore(db, current_user.family_id, chore_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/analytics/children/{child_id}", response_model=AnalyticsOut)
def analytics_for_child(
    child_id: str,
    period: str = Query(default="weekly", pattern="^(weekly|monthly|quarterly|half_yearly|yearly)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return child_analytics(db, current_user.family_id, child_id, period)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/children/{child_id}/daily-logs", response_model=list[DailyLogOut])
def daily_logs(
    child_id: str,
    day: date = Query(default_factory=date.today),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return ensure_daily_logs(db, current_user.family_id, child_id, day)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/daily-logs/{log_id}/submit", response_model=DailyLogOut)
def submit_daily_log(
    log_id: str,
    payload: SubmitLogIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return submit_log(db, current_user.family_id, log_id, payload.value, payload.note)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/daily-logs/{log_id}/review", response_model=DailyLogOut)
def review_daily_log(
    log_id: str,
    payload: ReviewLogIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return review_log(db, current_user, log_id, payload.approved, payload.value, payload.note)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/approvals/pending", response_model=list[DailyLogOut])
def approvals_pending(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return pending_logs(db, current_user.family_id)


@router.get("/payouts/weekly", response_model=list[WeeklyPayoutOut])
def weekly_payouts(
    day: date = Query(default_factory=date.today),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return live_weekly_payouts(db, current_user.family_id, day)


@router.post("/payouts/finalize")
def finalize_weekly_payout(
    payload: FinalizePayoutIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    try:
        payout = finalize_payout(db, current_user.family_id, payload.child_id, payload.week_start)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {
        "id": payout.id,
        "child_id": payout.child_id,
        "week_start": payout.week_start,
        "week_end": payout.week_end,
        "total_points": payout.total_points,
        "rupees": payout.rupees,
        "status": payout.status,
    }
