package com.servicesphere.backend.controller;

import com.servicesphere.backend.model.Assignment;
import com.servicesphere.backend.repository.AssignmentRepository;
import com.servicesphere.backend.repository.JobRepository;
import com.servicesphere.backend.repository.WorkerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    private record MetricsSnapshot(
        String algorithm,
        long totalWorkers,
        long availableWorkers,
        long busyWorkers,
        long offlineWorkers,
        long pendingJobs,
        long assignedJobs,
        long inProgressJobs,
        long completedJobs
    ) {
    }

    private record RecentAllocation(
        Long id,
        Long jobId,
        Long workerId,
        String workerName,
        String serviceType,
        String status,
        Integer etaMinutes,
        Double routeDistanceKm,
        Double score,
        LocalDateTime assignedAt
    ) {
    }

    private record LoadBand(String label, long value) {
    }

    private record AdminOverviewResponse(
        MetricsSnapshot metrics,
        List<RecentAllocation> recentAllocations,
        List<LoadBand> loadBands
    ) {
    }

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private WorkerRepository workerRepository;

    @GetMapping("/metrics")
    public Map<String, Object> getMetrics() {
        long availableWorkers = workerRepository.countByIsAvailableTrue();
        long busyWorkers = workerRepository.countByIsAvailableTrueAndLoadCountGreaterThan(0);
        return Map.of(
            "algorithm", "Greedy EDF + Dijkstra",
            "average_dijkstra_calls", 45,
            "average_shortlist_size", Math.max(availableWorkers - busyWorkers, 0),
            "fairness_active", true
        );
    }

    @GetMapping("/overview")
    public AdminOverviewResponse getOverview() {
        long totalWorkers = workerRepository.count();
        long availableWorkers = workerRepository.countByIsAvailableTrue();
        long busyWorkers = workerRepository.countByIsAvailableTrueAndLoadCountGreaterThan(0);
        long offlineWorkers = workerRepository.countByIsAvailableFalse();

        MetricsSnapshot metrics = new MetricsSnapshot(
            "Greedy EDF + Dijkstra",
            totalWorkers,
            availableWorkers,
            busyWorkers,
            offlineWorkers,
            jobRepository.countByStatus("pending"),
            jobRepository.countByStatus("assigned"),
            jobRepository.countByStatus("in_progress"),
            jobRepository.countByStatus("completed")
        );

        List<RecentAllocation> recentAllocations = assignmentRepository.findTop8ByOrderByAssignedAtDesc()
            .stream()
            .map(this::mapAllocation)
            .toList();

        long readyWorkers = Math.max(availableWorkers - busyWorkers, 0);
        List<LoadBand> loadBands = List.of(
            new LoadBand("Ready", readyWorkers),
            new LoadBand("Busy", busyWorkers),
            new LoadBand("Offline", offlineWorkers)
        );

        return new AdminOverviewResponse(metrics, recentAllocations, loadBands);
    }

    private RecentAllocation mapAllocation(Assignment assignment) {
        return new RecentAllocation(
            assignment.getId(),
            assignment.getJob() != null ? assignment.getJob().getId() : null,
            assignment.getWorker() != null ? assignment.getWorker().getId() : null,
            assignment.getWorker() != null ? assignment.getWorker().getName() : "Unavailable worker",
            assignment.getJob() != null ? assignment.getJob().getServiceType() : "Service",
            assignment.getJob() != null ? assignment.getJob().getStatus() : "unknown",
            assignment.getEtaMinutes(),
            assignment.getRouteDistanceKm(),
            assignment.getScore(),
            assignment.getAssignedAt()
        );
    }
}
