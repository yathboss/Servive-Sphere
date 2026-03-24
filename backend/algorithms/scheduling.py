from datetime import datetime
import heapq

# Correctness: Greedy assignment prioritizing by (datetime, -priority, load_count).
# Fairness: Considers the current load count of workers to avoid starvation / overloading.
# Big-O: O(J log J) to sort jobs + O(J * W) to scan workers per job for score, where J=jobs, W=workers.

def allocate_jobs(jobs: list, workers: list, calculate_score_fn) -> list:
    """
    jobs: List of pending job objects
    workers: List of available worker objects (all workers in DB that are is_available=True)
    calculate_score_fn: Async/Sync function (job, worker) -> Score dict or None if invalid.
    
    Returns a list of dicts: {"job_id": job.id, "worker_id": worker.id, "score": float, "eta": int, "details": dict}
    """
    if not jobs or not workers:
        return []

    # 1. Sort jobs by Priority (descending) and Deadline (ascending)
    # Priority defaults 1-5, where 5 is highest priority.
    # Earliest Deadline First (EDF) + priority
    
    # Custom sort key: Higher priority first (-job.priority), then Earliest deadline
    def job_sort_key(job):
        deadline = job.deadline_ts if job.deadline_ts else datetime.max
        return (-job.priority, deadline)
        
    sorted_jobs = sorted(jobs, key=job_sort_key)
    
    allocations = []
    
    # We will keep track of mutated load_counts locally during allocation batch
    worker_loads = {w.id: w.load_count for w in workers}
    
    for job in sorted_jobs:
        best_worker = None
        best_score = -float('inf')
        best_details = None
        
        for worker in workers:
            # calculate basic suitability (score ignores load initially)
            # In a real system, `calculate_score_fn` might encapsulate Dijkstra/Haversine filtering
            # For simplicity here, we assume it's calculated or pre-calculated
            
            evaluation = calculate_score_fn(job, worker)
            if not evaluation or not evaluation.get('is_eligible'):
                continue
                
            base_score = evaluation['score']
            
            # FAIRNESS RULE:
            # Penalize the score significantly if the worker has a high load_count
            # e.g., reduce score by 10% per active load
            current_load = worker_loads[worker.id]
            penalty_factor = 1.0 - (0.10 * current_load) 
            final_score = base_score * penalty_factor if penalty_factor > 0 else 0
            
            if final_score > best_score:
                best_score = final_score
                best_worker = worker
                best_details = {
                    "base_score": base_score,
                    "final_score": final_score,
                    "load_penalty_applied": current_load,
                    "route_distance": evaluation['route_distance']
                }
                
        if best_worker:
            allocations.append({
                "job_id": job.id,
                "worker_id": best_worker.id,
                "eta_minutes": int(best_details['route_distance'] * 2), # e.g. 2 mins per km
                "score": best_score,
                "reason_json": best_details
            })
            # Update internal load to maintain fairness for next jobs in batch
            worker_loads[best_worker.id] += 1
            # In this batch, this worker is no longer "available" for overlapping time jobs? 
            # Or they just get higher load. Let's just increase load.
            
    return allocations
