from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Any
from datetime import datetime

class WorkerBase(BaseModel):
    name: str
    skills: List[str]
    base_price: float
    rating_avg: float
    jobs_completed: int
    lat: float
    lon: float
    is_available: bool

class WorkerResponse(WorkerBase):
    id: int
    load_count: int
    
    model_config = ConfigDict(from_attributes=True)

class RankedWorkerResponse(WorkerResponse):
    haversine_distance: float
    route_distance: float
    score: float
    score_breakdown: Any

class JobCreate(BaseModel):
    user_id: int
    service_type: str
    user_lat: float
    user_lon: float
    priority: int = 3
    deadline_minutes: int
    budget_optional: Optional[float] = None

class JobResponse(BaseModel):
    id: int
    service_type: str
    priority: int
    status: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class AssignmentResponse(BaseModel):
    id: int
    job_id: int
    worker_id: int
    assigned_at: datetime
    eta_minutes: int
    route_distance_km: float
    score: float
    reason_json: Any

    model_config = ConfigDict(from_attributes=True)
