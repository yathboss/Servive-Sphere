import os
import json
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from .database import engine, Base, get_db
from . import models, schemas, crud
from .algorithms import filtering, dijkstra, ranking, scheduling

app = FastAPI(title="ServiceSphere API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load global graph
road_graph = None

@app.on_event("startup")
async def startup_event():
    global road_graph
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    # Load roadmap json
    try:
        with open("backend/road_graph.json", "r") as f:
            graph_data = json.load(f)
            road_graph = dijkstra.load_graph_from_json(graph_data)
    except FileNotFoundError:
        print("Warning: road_graph.json not found.")

@app.get("/")
def read_root():
    return {"message": "Welcome to ServiceSphere API"}

@app.post("/seed")
async def seed_database(db: AsyncSession = Depends(get_db)):
    res = await crud.seed_data(db)
    return res

@app.get("/workers/search", response_model=List[schemas.RankedWorkerResponse])
async def search_workers(
    lat: float, 
    lon: float, 
    service_type: str, 
    radius_km: float = 10.0, 
    k: int = 5,
    db: AsyncSession = Depends(get_db)
):
    global road_graph
    # 1. Get available workers from DB
    all_workers = await crud.get_all_workers(db, service_type)
    
    # 2. Filter using Haversine
    shortlist_tuples = filtering.filter_workers_by_radius(all_workers, lat, lon, radius_km)
    
    if not shortlist_tuples:
        return []
        
    shortlist_dict = [{"worker": t[0], "haversine_distance": t[1]} for t in shortlist_tuples]
    
    # 3. NetworkX Dijkstra distances
    if road_graph:
        shortlist_dict = dijkstra.calculate_route_distances(road_graph, lat, lon, shortlist_dict)
    else:
        for w in shortlist_dict:
            w['route_distance'] = w['haversine_distance'] * 1.3
            
    # 4. Rank workers
    ranked = ranking.rank_workers(shortlist_dict)
    
    # Format for response
    response_list = []
    for r in ranked[:k]:
        w_obj = r['worker']
        response_list.append(schemas.RankedWorkerResponse(
            name=w_obj.name,
            skills=w_obj.skills,
            base_price=w_obj.base_price,
            rating_avg=w_obj.rating_avg,
            jobs_completed=w_obj.jobs_completed,
            lat=w_obj.lat,
            lon=w_obj.lon,
            is_available=w_obj.is_available,
            id=w_obj.id,
            load_count=w_obj.load_count,
            haversine_distance=r['haversine_distance'],
            route_distance=r['route_distance'],
            score=r['score'],
            score_breakdown=r['score_breakdown']
        ))
        
    return response_list

@app.post("/jobs", response_model=schemas.JobResponse)
async def create_job(job: schemas.JobCreate, db: AsyncSession = Depends(get_db)):
    db_job = await crud.create_job(db, job)
    return db_job

@app.post("/allocate")
async def allocate_jobs(db: AsyncSession = Depends(get_db)):
    global road_graph
    
    pending_jobs = await crud.get_pending_jobs(db)
    if not pending_jobs:
        return {"message": "No pending jobs"}
        
    # We load all workers to pass to greedy scheduler
    # In practice, this would be an iterative fetch or chunked by service area.
    workers_res = await db.execute(crud.select(crud.models.Worker).where(crud.models.Worker.is_available == True))
    all_workers = workers_res.scalars().all()
    
    def calculate_score(job, worker):
        # Is capable?
        if job.service_type.lower() not in [s.lower() for s in worker.skills]:
            return None
            
        # Distances
        hav_dist = filtering.calculate_haversine(job.user_lat, job.user_lon, worker.lat, worker.lon)
        if road_graph:
            user_node = dijkstra.find_nearest_node(road_graph, job.user_lat, job.user_lon)
            worker_node = dijkstra.find_nearest_node(road_graph, worker.lat, worker.lon)
            try:
                if user_node == worker_node:
                    route_dist = 0.0
                else:
                    route_dist = dijkstra.nx.dijkstra_path_length(road_graph, user_node, worker_node, weight='weight')
            except:
                route_dist = hav_dist * 10
        else:
            route_dist = hav_dist * 1.3
            
        # Simplified scoring on the fly for the allocator 
        # (Could reuse `ranking.py` but here we evaluate pair-wise against constraints)
        if hasattr(job, "budget_optional") and job.budget_optional:
            if worker.base_price > job.budget_optional:
                return None
                
        # Base score prioritizing high rating and low distance
        score = (worker.rating_avg / 5.0) * 0.5 - (route_dist / 100.0) * 0.5
        
        return {
            "is_eligible": True,
            "score": score,
            "route_distance": route_dist
        }

    allocations = scheduling.allocate_jobs(pending_jobs, all_workers, calculate_score)
    
    if not allocations:
        return {"message": "Could not allocate any jobs", "allocations": []}
        
    # Commit allocations to DB
    for alloc in allocations:
        await crud.create_assignment(
            db=db,
            job_id=alloc['job_id'],
            worker_id=alloc['worker_id'],
            eta=alloc['eta_minutes'],
            route_distance=alloc['route_distance'],
            score=alloc['score'],
            reason_json=alloc['reason_json']
        )
        
    return {"message": f"Allocated {len(allocations)} jobs", "allocations": allocations}

@app.get("/jobs/{job_id}")
async def get_job_details(job_id: int, db: AsyncSession = Depends(get_db)):
    res = await crud.get_job_with_assignment(db, job_id)
    if not res:
        raise HTTPException(status_code=404, detail="Job not found")
    return res
