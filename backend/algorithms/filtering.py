import math

# Correctness: Haversine distance correctly computes the great-circle distance between two points on a sphere.
# Big-O: O(1) for a single distance calculation. For N workers, filtering takes O(N).

def calculate_haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    Returns distance in kilometers.
    """
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    r = 6371 # Radius of earth in kilometers
    return c * r

def filter_workers_by_radius(workers: list, user_lat: float, user_lon: float, radius_km: float) -> list:
    """
    Filters a list of workers keeping only those within radius_km.
    Returns a list of tuples: (worker, haversine_distance)
    """
    shortlist = []
    for w in workers:
        dist = calculate_haversine(user_lat, user_lon, w.lat, w.lon)
        if dist <= radius_km:
            shortlist.append((w, dist))
    return shortlist
