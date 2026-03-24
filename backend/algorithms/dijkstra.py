import networkx as nx
import math

# Correctness: Uses NetworkX's dijkstra_path_length for accurate route distance calculation on a graph.
# Big-O: O((V + E) log V) where V is the number of nodes and E is the number of edges. 
# Finding nearest node is O(V) per query. Total for W workers is O(W * V + W * (V + E) log V).

def find_nearest_node(graph: nx.Graph, lat: float, lon: float) -> str:
    """
    Finds the nearest node in the road graph to the given lat, lon using Euclidean distance.
    (For real-world we'd use Haversine, but this works fine for small local graphs)
    """
    min_dist = float('inf')
    nearest_node = None
    
    for node, data in graph.nodes(data=True):
        if 'lat' not in data or 'lon' not in data:
            continue
        # Assuming local Euclidean approximation for speed, or haversine
        dist = math.hypot(lat - data['lat'], lon - data['lon'])
        if dist < min_dist:
            min_dist = dist
            nearest_node = node
            
    return nearest_node

def calculate_route_distances(road_graph: nx.Graph, user_lat: float, user_lon: float, workers: list) -> list:
    """
    Input:
      road_graph: NetworkX graph with 'weight' on edges
      user_lat, user_lon: Coordinates of user
      workers: List of dicts [{"worker": worker_obj, "haversine_distance": dist}]
    Output:
      List of dicts with added "route_distance"
    """
    user_node = find_nearest_node(road_graph, user_lat, user_lon)
    if not user_node:
        # Fallback to haversine if graph is invalid
        for w in workers:
            w['route_distance'] = w['haversine_distance'] * 1.3 # 1.3 roughly approximates road factor
        return workers

    result = []
    for w in workers:
        worker_obj = w['worker']
        worker_node = find_nearest_node(road_graph, worker_obj.lat, worker_obj.lon)
        
        try:
            if user_node == worker_node:
                route_dist = 0.0
            else:
                route_dist = nx.dijkstra_path_length(road_graph, user_node, worker_node, weight='weight')
            w['route_distance'] = route_dist
        except nx.NetworkXNoPath:
            # If no path exists, penalize heavily
            w['route_distance'] = w['haversine_distance'] * 10.0
            
        result.append(w)
        
    return result

def load_graph_from_json(graph_data: dict) -> nx.Graph:
    """
    Reconstructs the NetworkX graph from a dict.
    """
    G = nx.Graph()
    for node in graph_data.get('nodes', []):
        G.add_node(node['id'], lat=node['lat'], lon=node['lon'])
    for edge in graph_data.get('edges', []):
        G.add_edge(edge['u'], edge['v'], weight=edge['weight'])
    return G
