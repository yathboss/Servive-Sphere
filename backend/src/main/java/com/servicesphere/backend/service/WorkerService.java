package com.servicesphere.backend.service;

import com.servicesphere.backend.algorithms.RankingEngine;
import com.servicesphere.backend.algorithms.DijkstraAlgorithm;
import com.servicesphere.backend.algorithms.HaversineDistance;
import com.servicesphere.backend.algorithms.RoadGraph;
import com.servicesphere.backend.algorithms.GraphLoader;
import com.servicesphere.backend.dto.RankedWorkerResponse;
import com.servicesphere.backend.dto.WorkerCreate;
import com.servicesphere.backend.dto.WorkerResponse;
import com.servicesphere.backend.model.Worker;
import com.servicesphere.backend.repository.WorkerRepository;
import com.servicesphere.backend.util.ServiceTypeNormalizer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
public class WorkerService {

    @Autowired
    private WorkerRepository workerRepository;

    @Autowired
    private RankingEngine rankingEngine;

    @Autowired
    private DijkstraAlgorithm dijkstraAlgorithm;

    @Autowired
    private GraphLoader graphLoader;

    private RoadGraph roadGraph;

    @PostConstruct
    public void init() {
        this.roadGraph = graphLoader.loadGraph("classpath:road_graph.json");
    }

    public RoadGraph getRoadGraph() {
        return this.roadGraph;
    }

    public Worker createWorker(WorkerCreate dto) {
        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Worker name is required.");
        }

        if (dto.getLat() == null || dto.getLon() == null) {
            throw new ResponseStatusException(BAD_REQUEST, "A primary location is required.");
        }

        List<String> normalizedSkills = normalizeSkills(dto.getSkills());
        if (normalizedSkills.isEmpty()) {
            throw new ResponseStatusException(BAD_REQUEST, "Select at least one skill.");
        }

        Worker worker = new Worker();
        worker.setName(dto.getName().trim());
        worker.setEmail(clean(dto.getEmail()));
        worker.setPhone(clean(dto.getPhone()));
        worker.setCity(clean(dto.getCity()));
        worker.setBio(clean(dto.getBio()));
        worker.setSkills(normalizedSkills);
        worker.setServiceAreas(normalizeLabels(dto.getServiceAreas()));
        worker.setBasePrice(dto.getBasePrice() != null ? dto.getBasePrice() : 0.0);
        worker.setLat(dto.getLat());
        worker.setLon(dto.getLon());
        worker.setIsAvailable(dto.getIsAvailable() == null ? true : dto.getIsAvailable());
        worker.setLoadCount(0);
        worker.setJobsCompleted(0);
        worker.setRatingAvg(0.0);

        return workerRepository.save(worker);
    }

    public List<RankedWorkerResponse> searchWorkers(double lat, double lon, String serviceType, double radiusKm, int limit) {
        List<Worker> allWorkers = workerRepository.findByIsAvailableTrue();

        List<WorkerResponse> shortlisted = new ArrayList<>();
        List<Double> haversineDistances = new ArrayList<>();
        List<Double> routeDistances = new ArrayList<>();

        for (Worker w : allWorkers) {
            if (!ServiceTypeNormalizer.matchesSkill(w.getSkills(), serviceType)) {
                continue;
            }

            double havDist = HaversineDistance.calculate(lat, lon, w.getLat(), w.getLon());
            if (havDist <= radiusKm) {
                WorkerResponse wr = new WorkerResponse();
                wr.setId(w.getId());
                wr.setName(w.getName());
                wr.setSkills(w.getSkills());
                wr.setBasePrice(w.getBasePrice());
                wr.setRatingAvg(w.getRatingAvg());
                wr.setJobsCompleted(w.getJobsCompleted());
                wr.setLat(w.getLat());
                wr.setLon(w.getLon());
                wr.setIsAvailable(w.getIsAvailable());
                wr.setLoadCount(w.getLoadCount());

                shortlisted.add(wr);
                haversineDistances.add(havDist);

                double routeDist;
                if (roadGraph != null && roadGraph.getAllNodes().size() > 0) {
                    String userNode = dijkstraAlgorithm.findNearestNode(roadGraph, lat, lon);
                    String workerNode = dijkstraAlgorithm.findNearestNode(roadGraph, w.getLat(), w.getLon());
                    try {
                        routeDist = dijkstraAlgorithm.calculateShortestPath(roadGraph, userNode, workerNode);
                    } catch (Exception e) {
                        routeDist = havDist * 10;
                    }
                } else {
                    routeDist = havDist * 1.3;
                }
                routeDistances.add(routeDist);
            }
        }

        if (shortlisted.isEmpty()) return new ArrayList<>();

        List<RankedWorkerResponse> ranked = rankingEngine.rankWorkers(shortlisted, routeDistances, haversineDistances, 0.5, 0.2, 0.3);

        if (ranked.size() > limit) return ranked.subList(0, limit);
        return ranked;
    }

    private String clean(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private List<String> normalizeSkills(List<String> rawSkills) {
        if (rawSkills == null || rawSkills.isEmpty()) {
            return List.of();
        }

        return rawSkills.stream()
            .map(ServiceTypeNormalizer::toDisplayLabel)
            .filter(Objects::nonNull)
            .map(String::trim)
            .filter(skill -> !skill.isEmpty())
            .collect(java.util.stream.Collectors.collectingAndThen(
                java.util.stream.Collectors.toCollection(LinkedHashSet::new),
                ArrayList::new
            ));
    }

    private List<String> normalizeLabels(List<String> rawValues) {
        if (rawValues == null || rawValues.isEmpty()) {
            return List.of();
        }

        return rawValues.stream()
            .filter(Objects::nonNull)
            .map(String::trim)
            .filter(value -> !value.isEmpty())
            .collect(java.util.stream.Collectors.collectingAndThen(
                java.util.stream.Collectors.toCollection(LinkedHashSet::new),
                ArrayList::new
            ));
    }
}
