
import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str | None] = mapped_column(
        String(255), nullable=True, unique=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    missions: Mapped[list["Mission"]] = relationship(
        back_populates="user",
        passive_deletes=True,
    )


class Mission(TimestampMixin, Base):
    __tablename__ = "missions"
    __table_args__ = (
        CheckConstraint(
            "status IN ('planned', 'active', 'completed', 'cancelled')",
            name="ck_missions_status",
        ),
        CheckConstraint(
            "end_date IS NULL OR end_date >= start_date",
            name="ck_missions_date_range",
        ),
        Index("ix_missions_user_id", "user_id"),
        Index("ix_missions_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_profiles.id", ondelete="RESTRICT"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, server_default=text("'planned'")
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    user: Mapped["UserProfile"] = relationship(back_populates="missions")
    mission_days: Mapped[list["MissionDay"]] = relationship(
        back_populates="mission",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class MissionDay(TimestampMixin, Base):
    __tablename__ = "mission_days"
    __table_args__ = (
        UniqueConstraint(
            "mission_id", "day_number", name="uq_mission_days_number"
        ),
        UniqueConstraint(
            "mission_id", "mission_date", name="uq_mission_days_date"
        ),
        CheckConstraint("day_number > 0", name="ck_mission_days_positive"),
        Index("ix_mission_days_mission_date", "mission_date"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    mission_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("missions.id", ondelete="CASCADE"),
        nullable=False,
    )
    day_number: Mapped[int] = mapped_column(Integer, nullable=False)
    mission_date: Mapped[date] = mapped_column(Date, nullable=False)

    mission: Mapped["Mission"] = relationship(back_populates="mission_days")
    health_records: Mapped[list["HealthRecord"]] = relationship(
        back_populates="mission_day", cascade="all, delete-orphan",
        passive_deletes=True,
    )
    symptom_logs: Mapped[list["SymptomLog"]] = relationship(
        back_populates="mission_day", cascade="all, delete-orphan",
        passive_deletes=True,
    )
    daily_checklists: Mapped[list["DailyChecklist"]] = relationship(
        back_populates="mission_day", cascade="all, delete-orphan",
        passive_deletes=True,
    )
    health_assessments: Mapped[list["HealthAssessment"]] = relationship(
        back_populates="mission_day", cascade="all, delete-orphan",
        passive_deletes=True,
    )


class HealthRecord(TimestampMixin, Base):
    __tablename__ = "health_records"
    __table_args__ = (
        CheckConstraint(
            "measurement_type IN "
            "('heart_rate', 'oxygen_saturation', 'body_temperature', "
            "'sleep_duration', 'water_intake', 'exercise_duration')",
            name="ck_health_records_measurement_type",
        ),
        CheckConstraint("value >= 0", name="ck_health_records_nonnegative"),
        CheckConstraint(
            "(measurement_type = 'heart_rate' AND unit = 'bpm') OR "
            "(measurement_type = 'oxygen_saturation' AND unit = '%') OR "
            "(measurement_type = 'body_temperature' AND unit = '°C') OR "
            "(measurement_type = 'sleep_duration' AND unit = 'hours') OR "
            "(measurement_type = 'water_intake' AND unit = 'mL') OR "
            "(measurement_type = 'exercise_duration' AND unit = 'minutes')",
            name="ck_health_records_unit_matches_type",
        ),
        CheckConstraint(
            "measurement_type != 'oxygen_saturation' OR value <= 100",
            name="ck_health_records_oxygen_range",
        ),
        CheckConstraint(
            "source IN ('manual', 'device', 'imported')",
            name="ck_health_records_source",
        ),
        Index(
            "ix_health_records_day_type_time",
            "mission_day_id", "measurement_type", "recorded_at",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    mission_day_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("mission_days.id", ondelete="CASCADE"),
        nullable=False,
    )
    measurement_type: Mapped[str] = mapped_column(String(30), nullable=False)
    value: Mapped[Decimal] = mapped_column(Numeric(10, 3), nullable=False)
    unit: Mapped[str] = mapped_column(String(10), nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    source: Mapped[str] = mapped_column(
        String(30), nullable=False, server_default=text("'manual'")
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    mission_day: Mapped["MissionDay"] = relationship(
        back_populates="health_records"
    )


class SymptomLog(TimestampMixin, Base):
    __tablename__ = "symptom_logs"
    __table_args__ = (
        CheckConstraint(
            "severity BETWEEN 1 AND 5", name="ck_symptom_logs_severity"
        ),
        Index(
            "ix_symptom_logs_day_recorded",
            "mission_day_id", "recorded_at",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    mission_day_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("mission_days.id", ondelete="CASCADE"),
        nullable=False,
    )
    symptom_type: Mapped[str] = mapped_column(String(100), nullable=False)
    severity: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    mission_day: Mapped["MissionDay"] = relationship(
        back_populates="symptom_logs"
    )


class DailyChecklist(TimestampMixin, Base):
    __tablename__ = "daily_checklists"
    __table_args__ = (
        UniqueConstraint(
            "mission_day_id", "task_name", name="uq_checklists_day_task"
        ),
        CheckConstraint(
            "(is_completed = TRUE AND completed_at IS NOT NULL) OR "
            "(is_completed = FALSE AND completed_at IS NULL)",
            name="ck_checklists_completion_consistency",
        ),
        Index("ix_daily_checklists_mission_day", "mission_day_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    mission_day_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("mission_days.id", ondelete="CASCADE"),
        nullable=False,
    )
    task_name: Mapped[str] = mapped_column(String(150), nullable=False)
    is_completed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default=text("false")
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    mission_day: Mapped["MissionDay"] = relationship(
        back_populates="daily_checklists"
    )


class HealthAssessment(TimestampMixin, Base):
    __tablename__ = "health_assessments"
    __table_args__ = (
        CheckConstraint(
            "result IN "
            "('no_flag', 'review_recommended', 'insufficient_data')",
            name="ck_health_assessments_result",
        ),
        Index(
            "ix_health_assessments_day_created",
            "mission_day_id", "created_at",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    mission_day_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("mission_days.id", ondelete="CASCADE"),
        nullable=False,
    )
    assessment_type: Mapped[str] = mapped_column(String(50), nullable=False)
    result: Mapped[str] = mapped_column(String(30), nullable=False)
    details: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, server_default=text("'{}'::jsonb")
    )

    mission_day: Mapped["MissionDay"] = relationship(
        back_populates="health_assessments"
    )
