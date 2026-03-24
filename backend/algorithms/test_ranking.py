import pytest
from backend.algorithms.ranking import normalize, rank_workers

class DummyWorker:
    def __init__(self, rating, price):
        self.rating_avg = rating
        self.base_price = price

def test_normalize():
    res = normalize([10, 20, 30])
    assert res == [0.0, 0.5, 1.0]
    
    res_inv = normalize([10, 20, 30], invert=True)
    assert res_inv == [1.0, 0.5, 0.0]

def test_rank_workers():
    workers = [
        {"worker": DummyWorker(rating=5.0, price=50), "route_distance": 5.0, "haversine_distance": 4.0},
        {"worker": DummyWorker(rating=3.0, price=20), "route_distance": 10.0, "haversine_distance": 8.0},
        {"worker": DummyWorker(rating=4.5, price=100), "route_distance": 2.0, "haversine_distance": 1.5},
    ]
    
    # High rating, low price, low distance are preferred
    ranked = rank_workers(workers, w_rating=0.5, w_price=0.2, w_distance=0.3)
    
    # Check structure
    assert len(ranked) == 3
    assert "score" in ranked[0]
    # Check order
    scores = [w["score"] for w in ranked]
    assert scores == sorted(scores, reverse=True)
