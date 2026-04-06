package com.servicesphere.backend.algorithms;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.servicesphere.backend.model.Job;
import com.servicesphere.backend.model.Worker;
import com.servicesphere.backend.dto.AssignmentResponse;
import com.servicesphere.backend.util.ServiceTypeNormalizer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class SchedulingEngine {

    @Autowired
    private DijkstraAlgorithm dijkstraAlgorithm;
    
    // Road graph loaded application-wide
    private RoadGraph roadGraph;
    private final ObjectMapper mapper = new ObjectMapper();

    public void setRoadGraph(RoadGraph graph) {
        this.roadGraph = graph;
    }

    public List<AssignmentResponse> allocateJobs(List<Job> pendingJobs, List<Worker> availableWorkers) {
        if (pendingJobs == null || pendingJobs.isEmpty() || availableWorkers == null || availableWorkers.isEmpty()) {
            return new ArrayList<>();
        }

        // Sort jobs by priority (descending) then deadline (ascending) -> Greedy EDF
        pendingJobs.sort((j1, j2) -> {
            int priorityCmp = Integer.compare(j2.getPriority() == null ? 3 : j2.getPriority(), 
                                              j1.getPriority() == null ? 3 : j1.getPriority());
            if (priorityCmp != 0) return priorityCmp;
            LocalDateTime d1 = j1.getDeadlineTs() != null ? j1.getDeadlineTs() : LocalDateTime.MAX;
            LocalDateTime d2 = j2.getDeadlineTs() != null ? j2.getDeadlineTs() : LocalDateTime.MAX;
            return d1.compareTo(d2);
        });

        List<AssignmentResponse> allocations = new ArrayList<>();
        Map<Long, Integer> workerLoads = new HashMap<>();
        for (Worker w : availableWorkers) {
            workerLoads.put(w.getId(), w.getLoadCount() != null ? w.getLoadCount() : 0);
        }

        for (Job job : pendingJobs) {
            Worker bestWorker = null;
            double bestScore = -Double.MAX_VALUE;
            ObjectNode bestDetails = null;
            String requestedSkill = ServiceTypeNormalizer.canonicalize(job.getServiceType());
            Long preferredWorkerId = job.getPreferredWorkerId();

            for (Worker worker : availableWorkers) {
                if (preferredWorkerId != null && !preferredWorkerId.equals(worker.getId())) continue;
                if (!ServiceTypeNormalizer.matchesSkill(worker.getSkills(), requestedSkill)) continue;

                // Check budget
                if (job.getBudgetOptional() != null && worker.getBasePrice() > job.getBudgetOptional()) continue;

                double havDist = HaversineDistance.calculate(job.getUserLat(), job.getUserLon(), worker.getLat(), worker.getLon());
                double routeDist = havDist * 1.3;

                if (roadGraph != null) {
                    String userNode = dijkstraAlgorithm.findNearestNode(roadGraph, job.getUserLat(), job.getUserLon());
                    String workerNode = dijkstraAlgorithm.findNearestNode(roadGraph, worker.getLat(), worker.getLon());
                    try {
                        routeDist = dijkstraAlgorithm.calculateShortestPath(roadGraph, userNode, workerNode);
                    } catch (Exception e) {
                        routeDist = havDist * 10;
                    }
                }

                double baseScore = (worker.getRatingAvg() / 5.0) * 0.5 - (routeDist / 100.0) * 0.5;

                // Fairness penalty: reduce score by 10% per active load
                int currentLoad = workerLoads.getOrDefault(worker.getId(), 0);
                double penaltyFactor = 1.0 - (0.10 * currentLoad);
                double finalScore = penaltyFactor > 0 ? baseScore * penaltyFactor : 0;

                if (finalScore > bestScore) {
                    bestScore = finalScore;
                    bestWorker = worker;
                    bestDetails = mapper.createObjectNode();
                    bestDetails.put("base_score", baseScore);
                    bestDetails.put("final_score", finalScore);
                    bestDetails.put("load_penalty_applied", currentLoad);
                    bestDetails.put("route_distance", routeDist);
                }
            }

            if (bestWorker != null) {
                AssignmentResponse alloc = new AssignmentResponse();
                alloc.setJobId(job.getId());
                alloc.setWorkerId(bestWorker.getId());
                alloc.setEtaMinutes((int) (bestDetails.get("route_distance").asDouble() * 2));
                alloc.setScore(bestScore);
                alloc.setReasonJson(bestDetails);
                alloc.setRouteDistanceKm(bestDetails.get("route_distance").asDouble());

                allocations.add(alloc);
                workerLoads.put(bestWorker.getId(), workerLoads.get(bestWorker.getId()) + 1);
            }
        }

        return allocations;
    }
}
