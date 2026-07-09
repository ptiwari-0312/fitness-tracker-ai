"""Water intake tracking model."""
from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, BaseModel


class WaterLog(Base, BaseModel):
    """Single water intake entry for a user."""
    __tablename__ = "water_logs"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    log_date: Mapped[str] = mapped_column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    amount_ml: Mapped[float] = mapped_column(Float, nullable=False)
    logged_at: Mapped[str] = mapped_column(String(30), nullable=False)  # ISO datetime

    user: Mapped["User"] = relationship(back_populates="water_logs")
