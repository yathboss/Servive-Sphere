package com.servicesphere.backend.controller;

import com.servicesphere.backend.dto.RankedWorkerResponse;
import com.servicesphere.backend.dto.WorkerCreate;
import com.servicesphere.backend.service.WorkerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.CREATED;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api/workers")
@CrossOrigin(origins = "*")
public class WorkerController {

    private record WorkerSnapshot(
        Long id,
        String name,
        String email,
        String phone,
        String city,
        String bio,
        List<String> skills,
        List<String> serviceAreas,
        Boolean isAvailable,
        Double ratingAvg,
        Double basePrice,
        Integer jobsCompleted,
        Integer loadCount
    ) {
    }

    private record WorkerRegistrationResponse(
        Long id,
        String name,
        String city,
        List<String> skills,
        List<String> serviceAreas,
        Boolean isAvailable,
        String dashboardUrl
    ) {
    }

    private record WorkerDashboardSummary(
        long pendingJobs,
        long activeJobs,
        long completedJobs,
        int currentLoad,
        double activeDistanceKm
    ) {
    }

    private record WorkerDashboardResponse(
        WorkerSnapshot worker,
        WorkerDashboardSummary summary,
        List<com.servicesphere.backend.model.Assignment> assignments
    ) {
    }

    @Autowired
    private WorkerService workerService;

    @PostMapping
    public ResponseEntity<WorkerRegistrationResponse> registerWorker(@RequestBody WorkerCreate request) {
        var worker = workerService.createWorker(request);
        return ResponseEntity.status(CREATED).body(
            new WorkerRegistrationResponse(
                worker.getId(),
                worker.getName(),
                worker.getCity(),
                worker.getSkills(),
                worker.getServiceAreas(),
                worker.getIsAvailable(),
                "/worker/" + worker.getId()
            )
        );
    }

    @GetMapping("/search")
    public org.springframework.http.ResponseEntity<?> searchWorkers(
            @RequestParam double lat,
            @RequestParam double lon,
            @RequestParam String serviceType,
            @RequestParam(defaultValue = "10.0") double radiusKm,
            @RequestParam(defaultValue = "5") int k
    ) {
        try {
            return org.springframework.http.ResponseEntity.ok(workerService.searchWorkers(lat, lon, serviceType, radiusKm, k));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500).body("EXCEPTION_CAUGHT: " + e.getClass().getName() + " | Message: " + e.getMessage());
        }
    }

    @Autowired
    private com.servicesphere.backend.repository.AssignmentRepository assignmentRepository;

    @Autowired
    private com.servicesphere.backend.repository.WorkerRepository workerRepository;

    @GetMapping("/{id}/dashboard")
    public WorkerDashboardResponse getDashboard(@PathVariable Long id) {
        var worker = workerRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Worker not found."));

        List<com.servicesphere.backend.model.Assignment> assignments = assignmentRepository.findByWorkerIdOrderByJobDeadlineTsAsc(id);
        long pendingJobs = assignments.stream()
            .filter(assignment -> assignment.getJob() != null && "assigned".equalsIgnoreCase(assignment.getJob().getStatus()))
            .count();
        long activeJobs = assignments.stream()
            .filter(assignment -> assignment.getJob() != null && "in_progress".equalsIgnoreCase(assignment.getJob().getStatus()))
            .count();
        double activeDistanceKm = assignments.stream()
            .filter(assignment -> assignment.getJob() != null && !"completed".equalsIgnoreCase(assignment.getJob().getStatus()))
            .mapToDouble(assignment -> assignment.getRouteDistanceKm() != null ? assignment.getRouteDistanceKm() : 0.0)
            .sum();

        return new WorkerDashboardResponse(
            new WorkerSnapshot(
                worker.getId(),
                worker.getName(),
                worker.getEmail(),
                worker.getPhone(),
                worker.getCity(),
                worker.getBio(),
                worker.getSkills(),
                worker.getServiceAreas(),
                worker.getIsAvailable(),
                worker.getRatingAvg() != null ? worker.getRatingAvg() : 0.0,
                worker.getBasePrice() != null ? worker.getBasePrice() : 0.0,
                worker.getJobsCompleted() != null ? worker.getJobsCompleted() : 0,
                worker.getLoadCount() != null ? worker.getLoadCount() : 0
            ),
            new WorkerDashboardSummary(
                pendingJobs,
                activeJobs,
                worker.getJobsCompleted() != null ? worker.getJobsCompleted() : 0,
                worker.getLoadCount() != null ? worker.getLoadCount() : 0,
                activeDistanceKm
            ),
            assignments
        );
    }

    @PostMapping("/{id}/availability")
    public ResponseEntity<?> toggleAvailability(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        Boolean requestedAvailability = body.get("is_available");
        if (requestedAvailability == null) {
            throw new ResponseStatusException(BAD_REQUEST, "Availability flag is required.");
        }

        var worker = workerRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Worker not found."));
        worker.setIsAvailable(requestedAvailability);
        workerRepository.save(worker);
        return ResponseEntity.ok(Map.of("message", "Availability updated"));
    }
}
