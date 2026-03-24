import pytest
from backend.algorithms.filtering import calculate_haversine, filter_workers_by_radius

class DummyWorker:
    def __init__(self, lat, lon):
        self.lat = lat
        self.lon = lon

def test_calculate_haversine():
    # Times Square (40.7580, -73.9855) to Central Park (40.7812, -73.9665)
    # Approx 3 km
    dist = calculate_haversine(40.7580, -73.9855, 40.7812, -73.9665)
    assert 2.8 <= dist <= 3.2

def test_filter_workers_by_radius():
    workers = [
        DummyWorker(40.7580, -73.9855), # exact same location ~0km
        DummyWorker(40.7812, -73.9665), # ~3km
        DummyWorker(41.0, -74.0),       # >20km
    ]
    
    # 5km radius should return 2 workers
    shortlist = filter_workers_by_radius(workers, 40.7580, -73.9855, 5.0)
    assert len(shortlist) == 2
    
    # 1km radius should return 1 worker
    shortlist = filter_workers_by_radius(workers, 40.7580, -73.9855, 1.0)
    assert len(shortlist) == 1
