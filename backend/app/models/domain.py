import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Index, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class UserRole(str, enum.Enum):
    PARENT = "PARENT"
    ADMIN = "ADMIN"


class ChoreCategory(str, enum.Enum):
    HABIT = "Habit"
    FUN = "Fun"
    HEALTH = "Health"
    CHORES = "Chores"
    SKILLS = "Skills"


class ChoreType(str, enum.Enum):
    BOOLEAN = "BOOLEAN"
    SCORE = "SCORE"
    TIME_BASED = "TIME_BASED"


class LogStatus(str, enum.Enum):
    TODO = "TODO"
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ApprovalDecision(str, enum.Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class PayoutStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    FINALIZED = "FINALIZED"
    PAID = "PAID"


def uuid_pk() -> str:
    return str(uuid.uuid4())


class Family(Base):
    __tablename__ = "families"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_pk)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    point_to_rupee_rate: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    users: Mapped[list["User"]] = relationship(back_populates="family")
    children: Mapped[list["Child"]] = relationship(back_populates="family")


class User(Base):
    __tablename__ = "users"
    __table_args__ = (Index("ix_users_family_role", "family_id", "role"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_pk)
    family_id: Mapped[str] = mapped_column(ForeignKey("families.id", ondelete="CASCADE"), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False, default=UserRole.PARENT)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    family: Mapped[Family] = relationship(back_populates="users")


class Child(Base):
    __tablename__ = "children"
    __table_args__ = (
        UniqueConstraint("family_id", "name", name="uq_children_family_name"),
        Index("ix_children_family", "family_id"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_pk)
    family_id: Mapped[str] = mapped_column(ForeignKey("families.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    avatar_color: Mapped[str] = mapped_column(String(32), nullable=False, default="emerald")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    family: Mapped[Family] = relationship(back_populates="children")
    logs: Mapped[list["DailyLog"]] = relationship(back_populates="child")


class Chore(Base):
    __tablename__ = "chores"
    __table_args__ = (
        Index("ix_chores_family_category", "family_id", "category"),
        Index("ix_chores_active", "is_active"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_pk)
    family_id: Mapped[str | None] = mapped_column(ForeignKey("families.id", ondelete="CASCADE"), nullable=True)
    category: Mapped[ChoreCategory] = mapped_column(
        Enum(ChoreCategory, values_callable=lambda enum: [item.value for item in enum]),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    time_slot: Mapped[str | None] = mapped_column(String(40), nullable=True)
    type: Mapped[ChoreType] = mapped_column(Enum(ChoreType), nullable=False)
    max_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fixed_points: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    score_multiplier: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    minutes_per_point: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    logs: Mapped[list["DailyLog"]] = relationship(back_populates="chore")


class DailyLog(Base):
    __tablename__ = "daily_logs"
    __table_args__ = (
        UniqueConstraint("child_id", "chore_id", "log_date", name="uq_daily_logs_child_chore_date"),
        Index("ix_daily_logs_family_date", "family_id", "log_date"),
        Index("ix_daily_logs_child_date", "child_id", "log_date"),
        Index("ix_daily_logs_status", "status"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_pk)
    family_id: Mapped[str] = mapped_column(ForeignKey("families.id", ondelete="CASCADE"), nullable=False)
    child_id: Mapped[str] = mapped_column(ForeignKey("children.id", ondelete="CASCADE"), nullable=False)
    chore_id: Mapped[str] = mapped_column(ForeignKey("chores.id", ondelete="CASCADE"), nullable=False)
    log_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[LogStatus] = mapped_column(Enum(LogStatus), nullable=False, default=LogStatus.TODO)
    submitted_value: Mapped[int | None] = mapped_column(Integer, nullable=True)
    approved_value: Mapped[int | None] = mapped_column(Integer, nullable=True)
    points_awarded: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    child: Mapped[Child] = relationship(back_populates="logs")
    chore: Mapped[Chore] = relationship(back_populates="logs")
    approvals: Mapped[list["Approval"]] = relationship(back_populates="daily_log")


class Approval(Base):
    __tablename__ = "approvals"
    __table_args__ = (Index("ix_approvals_log", "daily_log_id"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_pk)
    daily_log_id: Mapped[str] = mapped_column(ForeignKey("daily_logs.id", ondelete="CASCADE"), nullable=False)
    parent_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    decision: Mapped[ApprovalDecision] = mapped_column(Enum(ApprovalDecision), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    daily_log: Mapped[DailyLog] = relationship(back_populates="approvals")


class Payout(Base):
    __tablename__ = "payouts"
    __table_args__ = (
        UniqueConstraint("child_id", "week_start", name="uq_payout_child_week"),
        Index("ix_payouts_family_week", "family_id", "week_start"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uuid_pk)
    family_id: Mapped[str] = mapped_column(ForeignKey("families.id", ondelete="CASCADE"), nullable=False)
    child_id: Mapped[str] = mapped_column(ForeignKey("children.id", ondelete="CASCADE"), nullable=False)
    week_start: Mapped[date] = mapped_column(Date, nullable=False)
    week_end: Mapped[date] = mapped_column(Date, nullable=False)
    total_points: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    rupees: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[PayoutStatus] = mapped_column(Enum(PayoutStatus), nullable=False, default=PayoutStatus.DRAFT)
    finalized_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
