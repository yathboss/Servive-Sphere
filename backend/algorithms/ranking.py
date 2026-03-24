import heapq

# Correctness: Ranks workers by combining normalized price, rating, and distance into a weighted score.
# Big-O: O(N) to normalize, plus O(N log N) to sort or O(K log N) with a heap. We use block sorting O(N log N) for simplicity and since N is small (shortlisted).

def normalize(values: list[float], invert: bool = False) -> list[float]:
    """
    Min-Max normalization to [0, 1].
    If invert is True, lower values get higher scores (e.g. for price/distance).
    """
    if not values:
        return []
    min_val = min(values)
    max_val = max(values)
    
    if max_val == min_val:
        return [0.5 for _ in values] # Handle identical values gracefully

    normalized = []
    for v in values:
        norm = (v - min_val) / (max_val - min_val)
        if invert:
            norm = 1.0 - norm
        normalized.append(norm)
    return normalized

def rank_workers(
    shortlisted_workers: list, # List of dicts or objects containing (worker, haversine_distance, route_distance)
    w_rating: float = 0.5,
    w_price: float = 0.2,
    w_distance: float = 0.3
) -> list:
    """
    Rank workers based on the weighted score.
    Score = wR*norm(rating) + wP*norm_invert(price) + wD*norm_invert(route_distance)
    Returns sorted list from highest score to lowest.
    """
    if not shortlisted_workers:
        return []

    ratings = [w['worker'].rating_avg for w in shortlisted_workers]
    prices = [w['worker'].base_price for w in shortlisted_workers]
    distances = [w['route_distance'] for w in shortlisted_workers]

    norm_ratings = normalize(ratings, invert=False)
    norm_prices = normalize(prices, invert=True) # Lower price is better
    norm_distances = normalize(distances, invert=True) # Lower distance is better

    scored_workers = []
    for i, w_data in enumerate(shortlisted_workers):
        score = (w_rating * norm_ratings[i]) + (w_price * norm_prices[i]) + (w_distance * norm_distances[i])
        breakdown = {
            "rating_norm": norm_ratings[i],
            "price_norm": norm_prices[i],
            "distance_norm": norm_distances[i]
        }
        
        # We store negative score because Python's heapq is a min-heap, but we want max-heap (highest score first)
        # Alternatively, we can just sort in descending order.
        scored_workers.append({
            **w_data,
            "score": score,
            "score_breakdown": breakdown
        })

    # Sort descending by score
    scored_workers.sort(key=lambda x: x["score"], reverse=True)
    
    return scored_workers
