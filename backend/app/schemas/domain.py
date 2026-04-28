from datetime import date

from pydantic import BaseModel, EmailStr, Field

from app.models import ChoreCategory, ChoreType, LogStatus, PayoutStatus


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class FamilyOut(BaseModel):
    id: str
    name: str
    point_to_rupee_rate: int

    model_config = {"from_attributes": True}


class ChildOut(BaseModel):
    id: str
    name: str
    avatar_color: str

    model_config = {"from_attributes": True}


class ChoreCreate(BaseModel):
    category: ChoreCategory
    name: str = Field(min_length=2, max_length=160)
    duration_minutes: int | None = Field(default=None, ge=0)
    time_slot: str | None = Field(default=None, max_length=40)
    type: ChoreType
    max_score: int | None = Field(default=None, ge=1)
    fixed_points: int = Field(default=1, ge=0)
    score_multiplier: int = Field(default=1, ge=0)
    minutes_per_point: int = Field(default=10, ge=1)


class ChoreUpdate(BaseModel):
    category: ChoreCategory | None = None
    name: str | None = Field(default=None, min_length=2, max_length=160)
    duration_minutes: int | None = Field(default=None, ge=0)
    time_slot: str | None = Field(default=None, max_length=40)
    type: ChoreType | None = None
    max_score: int | None = Field(default=None, ge=1)
    fixed_points: int | None = Field(default=None, ge=0)
    score_multiplier: int | None = Field(default=None, ge=0)
    minutes_per_point: int | None = Field(default=None, ge=1)
    is_active: bool | None = None


class ChoreOut(ChoreCreate):
    id: str
    family_id: str | None
    is_active: bool

    model_config = {"from_attributes": True}


class DailyLogOut(BaseModel):
    id: str
    log_date: date
    child_id: str
    chore: ChoreOut
    status: LogStatus
    submitted_value: int | None
    approved_value: int | None
    points_awarded: int
    note: str | None

    model_config = {"from_attributes": True}


class SubmitLogIn(BaseModel):
    value: int | None = Field(default=None, ge=0)
    note: str | None = Field(default=None, max_length=500)


class ReviewLogIn(BaseModel):
    approved: bool
    value: int | None = Field(default=None, ge=0)
    note: str | None = Field(default=None, max_length=500)


class DashboardOut(BaseModel):
    family: FamilyOut
    children: list[ChildOut]
    pending_approvals: int
    weekly_totals: dict[str, int]
    leaderboard: list[dict]


class WeeklyPayoutOut(BaseModel):
    child_id: str
    child_name: str
    week_start: date
    week_end: date
    total_points: int
    rupees: int
    status: PayoutStatus | str = "LIVE"


class FinalizePayoutIn(BaseModel):
    child_id: str
    week_start: date


class ChoreAnalyticsOut(BaseModel):
    chore_id: str
    chore_name: str
    category: str
    type: str
    total_logs: int
    submitted: int
    approved: int
    rejected: int
    points: int
    completion_rate: float
    approval_rate: float
    average_value: float | None
    insight: str


class AnalyticsOut(BaseModel):
    child: ChildOut
    period: str
    start_date: date
    end_date: date
    total_points: int
    total_logs: int
    completion_rate: float
    approval_rate: float
    strengths: list[ChoreAnalyticsOut]
    focus_areas: list[ChoreAnalyticsOut]
    trend: list[dict]
    ai_summary: list[str]
    chores: list[ChoreAnalyticsOut]
