package com.servicesphere.backend.algorithms;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.servicesphere.backend.dto.RankedWorkerResponse;
import com.servicesphere.backend.dto.WorkerResponse;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class RankingEngine {

    private final ObjectMapper mapper = new ObjectMapper();

    public List<RankedWorkerResponse> rankWorkers(
            List<WorkerResponse> shortlisted,
            List<Double> routeDistances,
            List<Double> haversineDistances,
            double wRating,
            double wPrice,
            double wDistance
    ) {
        if (shortlisted == null || shortlisted.isEmpty()) return new ArrayList<>();

        List<Double> ratings = new ArrayList<>();
        List<Double> prices = new ArrayList<>();

        for (WorkerResponse w : shortlisted) {
            ratings.add(w.getRatingAvg());
            prices.add(w.getBasePrice());
        }

        List<Double> normRatings = normalize(ratings, false);
        List<Double> normPrices = normalize(prices, true);
        List<Double> normDistances = normalize(routeDistances, true);

        List<RankedWorkerResponse> scoredWorkers = new ArrayList<>();

        for (int i = 0; i < shortlisted.size(); i++) {
            WorkerResponse w = shortlisted.get(i);
            double score = (wRating * normRatings.get(i)) +
                           (wPrice * normPrices.get(i)) +
                           (wDistance * normDistances.get(i));

            ObjectNode breakdown = mapper.createObjectNode();
            breakdown.put("rating_norm", normRatings.get(i));
            breakdown.put("price_norm", normPrices.get(i));
            breakdown.put("distance_norm", normDistances.get(i));

            RankedWorkerResponse rwr = new RankedWorkerResponse();
            rwr.setId(w.getId());
            rwr.setName(w.getName());
            rwr.setSkills(w.getSkills());
            rwr.setBasePrice(w.getBasePrice());
            rwr.setRatingAvg(w.getRatingAvg());
            rwr.setJobsCompleted(w.getJobsCompleted());
            rwr.setLat(w.getLat());
            rwr.setLon(w.getLon());
            rwr.setIsAvailable(w.getIsAvailable());
            rwr.setLoadCount(w.getLoadCount());
            
            rwr.setHaversineDistance(haversineDistances.get(i));
            rwr.setRouteDistance(routeDistances.get(i));
            rwr.setScore(score);
            rwr.setScoreBreakdown(breakdown);

            scoredWorkers.add(rwr);
        }

        scoredWorkers.sort((a, b) -> Double.compare(b.getScore(), a.getScore()));
        return scoredWorkers;
    }

    private List<Double> normalize(List<Double> values, boolean invert) {
        if (values.isEmpty()) return new ArrayList<>();
        double min = Collections.min(values);
        double max = Collections.max(values);

        List<Double> normalized = new ArrayList<>();
        if (max == min) {
            for (Double v : values) {
                normalized.add(0.5);
            }
            return normalized;
        }

        for (Double v : values) {
            double norm = (v - min) / (max - min);
            if (invert) {
                norm = 1.0 - norm;
            }
            normalized.add(norm);
        }
        return normalized;
    }
}
