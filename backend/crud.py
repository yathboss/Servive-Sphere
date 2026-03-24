from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from . import models, schemas
import json

async def create_user(db: AsyncSession, name: str, phone: str = ""):
    db_user = models.User(name=name, phone=phone)
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def seed_data(db: AsyncSession):
    # Check if we already have workers
    result = await db.execute(select(models.Worker))
    workers = result.scalars().all()
    if workers:
        return {"message": "Already seeded"}

    # Create dummy users
    await create_user(db, name="Alice Doe")
    await create_user(db, name="Bob Smith")

    # Create dummy workers spread around coordinates
    base_lat, base_lon = 40.7128, -74.0060

    dummy_workers = [
        {"name": "Plumber Joe", "skills": ["plumber"], "price": 50.0, "rating": 4.8, "lat": base_lat + 0.005, "lon": base_lon + 0.005},
        {"name": "Electrician Mike", "skills": ["electrician"], "price": 60.0, "rating": 4.5, "lat": base_lat - 0.005, "lon": base_lon - 0.005},
        {"name": "Carpenter Sam", "skills": ["carpenter"], "price": 55.0, "rating": 4.2, "lat": base_lat + 0.015, "lon": base_lon - 0.015},
        {"name": "Helper Dan", "skills": ["helper", "plumber"], "price": 30.0, "rating": 3.9, "lat": base_lat + 0.025, "lon": base_lon + 0.025},
        {"name": "Plumber Jane", "skills": ["plumber"], "price": 45.0, "rating": 4.9, "lat": base_lat + 0.035, "lon": base_lon - 0.005},
        {"name": "Electrician Sarah", "skills": ["electrician"], "price": 70.0, "rating": 5.0, "lat": base_lat - 0.015, "lon": base_lon + 0.015},
        {"name": "Carpenter Ed", "skills": ["carpenter"], "price": 40.0, "rating": 4.0, "lat": base_lat + 0.100, "lon": base_lon + 0.100}, # Far away
    ]

    for w in dummy_workers:
        db_worker = models.Worker(
            name=w["name"],
            skills=w["skills"],
            base_price=w["price"],
            rating_avg=w["rating"],
            lat=w["lat"],
            lon=w["lon"]
        )
        db.add(db_worker)
        
    await db.commit()
    return {"message": "Success"}

async def get_all_workers(db: AsyncSession, service_type: str = None):
    query = select(models.Worker).where(models.Worker.is_available == True)
    result = await db.execute(query)
    workers = result.scalars().all()
    if service_type:
        workers = [w for w in workers if service_type.lower() in [s.lower() for s in w.skills]]
    return workers

async def create_job(db: AsyncSession, job: schemas.JobCreate):
    from datetime import datetime, timedelta
    
    deadline = datetime.utcnow() + timedelta(minutes=job.deadline_minutes)
    
    db_job = models.Job(
        user_id=job.user_id,
        service_type=job.service_type,
        user_lat=job.user_lat,
        user_lon=job.user_lon,
        priority=job.priority,
        deadline_ts=deadline,
        budget_optional=job.budget_optional,
        status="pending"
    )
    db.add(db_job)
    await db.commit()
    await db.refresh(db_job)
    return db_job

async def get_pending_jobs(db: AsyncSession):
    query = select(models.Job).where(models.Job.status == "pending")
    res = await db.execute(query)
    return res.scalars().all()

async def create_assignment(db: AsyncSession, job_id: int, worker_id: int, eta: int, route_distance: float, score: float, reason_json: dict):
    db_assignment = models.Assignment(
        job_id=job_id,
        worker_id=worker_id,
        eta_minutes=eta,
        route_distance_km=route_distance,
        score=score,
        reason_json=reason_json
    )
    db.add(db_assignment)
    
    # Update Job status
    await db.execute(update(models.Job).where(models.Job.id == job_id).values(status="assigned"))
    
    # Update Worker load
    worker_res = await db.execute(select(models.Worker).where(models.Worker.id == worker_id))
    worker = worker_res.scalars().first()
    if worker:
        worker.load_count += 1
        db.add(worker)
        
    await db.commit()
    await db.refresh(db_assignment)
    return db_assignment

async def get_job_with_assignment(db: AsyncSession, job_id: int):
    query = select(models.Job).where(models.Job.id == job_id)
    res = await db.execute(query)
    job = res.scalars().first()
    
    if not job:
        return None
        
    assignment = None
    if job.status == "assigned":
        as_query = select(models.Assignment).where(models.Assignment.job_id == job_id)
        as_res = await db.execute(as_query)
        assignment = as_res.scalars().first()
        
    return {"job": job, "assignment": assignment}
