import pytest
from datetime import datetime, timedelta
from backend.algorithms.scheduling import allocate_jobs

class DummyJob:
    def __init__(self, id, priority, minutes_left):
        self.id = id
        self.priority = priority
        self.deadline_ts = datetime.utcnow() + timedelta(minutes=minutes_left)

class DummyWorker:
    def __init__(self, id, load_count=0):
        self.id = id
        self.load_count = load_count

def test_allocate_jobs():
    jobs = [
        DummyJob(1, priority=1, minutes_left=120),
        DummyJob(2, priority=5, minutes_left=30), # Should be allocated first
    ]
    
    workers = [
        DummyWorker(1, load_count=5), # Heavily loaded
        DummyWorker(2, load_count=0), # Fresh
    ]
    
    def mock_score(job, worker):
        # All eligible, base score 1.0
        return {"is_eligible": True, "score": 1.0, "route_distance": 5.0}
        
    allocations = allocate_jobs(jobs, workers, mock_score)
    
    assert len(allocations) == 2
    # Ensure job 2 (highest priority) gets worker 2 (fresh worker, full score 1.0)
    assert allocations[0]["job_id"] == 2
    assert allocations[0]["worker_id"] == 2
    
    # Ensure job 1 gets worker 1
    assert allocations[1]["job_id"] == 1
    assert allocations[1]["worker_id"] == 1
    
    # Check penalties
    assert allocations[1]["score"] < allocations[0]["score"]
