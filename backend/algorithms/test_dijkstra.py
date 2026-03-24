import pytest
import networkx as nx
from backend.algorithms.dijkstra import find_nearest_node, calculate_route_distances

class DummyWorker:
    def __init__(self, lat, lon):
        self.lat = lat
        self.lon = lon

def test_find_nearest_node():
    G = nx.Graph()
    G.add_node("A", lat=1.0, lon=1.0)
    G.add_node("B", lat=2.0, lon=2.0)
    
    node = find_nearest_node(G, 1.1, 1.1)
    assert node == "A"
    
def test_calculate_route_distances():
    G = nx.Graph()
    G.add_node("A", lat=1.0, lon=1.0)
    G.add_node("B", lat=1.0, lon=2.0)
    G.add_node("C", lat=2.0, lon=2.0)
    G.add_edge("A", "B", weight=10.0)
    G.add_edge("B", "C", weight=5.0)

    workers = [
        {"worker": DummyWorker(2.0, 2.0), "haversine_distance": 1.0}
    ]
    
    # User at A (1.0, 1.0), Worker at C (2.0, 2.0)
    res = calculate_route_distances(G, 1.0, 1.0, workers)
    
    assert res[0]["route_distance"] == 15.0
