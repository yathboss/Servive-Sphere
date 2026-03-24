from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String)

class Worker(Base):
    __tablename__ = "workers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    skills = Column(JSON, default=[])
    base_price = Column(Float, default=0.0)
    rating_avg = Column(Float, default=0.0)
    jobs_completed = Column(Integer, default=0)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    is_available = Column(Boolean, default=True)
    load_count = Column(Integer, default=0)

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    service_type = Column(String, index=True)
    user_lat = Column(Float, nullable=False)
    user_lon = Column(Float, nullable=False)
    priority = Column(Integer, default=3) # 1-5
    deadline_ts = Column(DateTime)
    budget_optional = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    status = Column(String, default="pending") # pending, assigned, completed
    user_id = Column(Integer, ForeignKey("users.id"))

    assignment = relationship("Assignment", back_populates="job", uselist=False)

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), unique=True)
    worker_id = Column(Integer, ForeignKey("workers.id"))
    assigned_at = Column(DateTime, server_default=func.now())
    eta_minutes = Column(Integer)
    route_distance_km = Column(Float)
    score = Column(Float)
    reason_json = Column(JSON)

    job = relationship("Job", back_populates="assignment")

class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    job_id = Column(Integer, ForeignKey("jobs.id"))
    stars = Column(Integer)
    comment = Column(String)
    created_at = Column(DateTime, server_default=func.now())
