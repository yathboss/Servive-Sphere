package com.servicesphere.backend.controller;

import com.servicesphere.backend.dto.JobCreate;
import com.servicesphere.backend.dto.JobResponse;
import com.servicesphere.backend.model.Assignment;
import com.servicesphere.backend.model.Job;
import com.servicesphere.backend.repository.AssignmentRepository;
import com.servicesphere.backend.repository.JobRepository;
import com.servicesphere.backend.repository.WorkerRepository;
import com.servicesphere.backend.service.AllocationService;
import com.servicesphere.backend.service.JobService;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Map;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api/jobs")
@CrossOrigin(origins = "*")
public class JobController {

    @Autowired
    private JobService jobService;
    
    @Autowired
    private AllocationService allocationService;
    
    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private WorkerRepository workerRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @PostMapping
    public JobResponse createJob(@RequestBody JobCreate request) {
        return jobService.createJob(request);
    }
    
    @GetMapping("/{id}")
    public JobDetailsResponse getJob(@PathVariable Long id) {
        Job job = jobRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Job not found."));

        Assignment assignment = assignmentRepository.findByJobId(id).orElse(null);
        return new JobDetailsResponse(
            new JobSnapshot(
                job.getId(),
                job.getServiceType(),
                job.getStatus(),
                job.getPriority(),
                job.getCreatedAt()
            ),
            assignment != null ? new AssignmentSnapshot(
                assignment.getId(),
                assignment.getWorker() != null ? assignment.getWorker().getId() : null,
                assignment.getWorker() != null ? assignment.getWorker().getName() : null,
                assignment.getEtaMinutes(),
                assignment.getRouteDistanceKm(),
                assignment.getScore(),
                assignment.getReasonJson()
            ) : null
        );
    }
    
    @PostMapping("/allocate")
    public Map<String, Object> allocateJobs() {
        return allocationService.allocatePendingJobs();
    }
    
    @PostMapping("/{id}/status")
    public ResponseEntity<?> updateJobStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Job job = jobRepository.findById(id).orElseThrow();
        String newStatus = body.get("status");
        job.setStatus(newStatus);
        
        if ("completed".equalsIgnoreCase(newStatus) && job.getAssignment() != null) {
            var worker = job.getAssignment().getWorker();
            if (worker.getLoadCount() > 0) {
                worker.setLoadCount(worker.getLoadCount() - 1);
            }
            worker.setJobsCompleted((worker.getJobsCompleted() != null ? worker.getJobsCompleted() : 0) + 1);
            workerRepository.save(worker);
        }
        
        jobRepository.save(job);
        return ResponseEntity.ok(Map.of("message", "Status updated successfully"));
    }
    
    @PostMapping("/{id}/decline")
    public ResponseEntity<?> declineJob(@PathVariable Long id) {
        Job job = jobRepository.findById(id).orElseThrow();
        Assignment assignment = job.getAssignment();
        if (assignment != null) {
            var worker = assignment.getWorker();
            if (worker.getLoadCount() > 0) worker.setLoadCount(worker.getLoadCount() - 1);
            workerRepository.save(worker);
            assignmentRepository.delete(assignment);
            job.setAssignment(null);
            job.setStatus("pending");
            jobRepository.save(job);
        }
        allocationService.allocatePendingJobs();
        return ResponseEntity.ok(Map.of("message", "Job declined and re-allocation triggered"));
    }

    public record JobDetailsResponse(
        JobSnapshot job,
        AssignmentSnapshot assignment
    ) {}

    public record JobSnapshot(
        Long id,
        String serviceType,
        String status,
        Integer priority,
        LocalDateTime createdAt
    ) {}

    public record AssignmentSnapshot(
        Long id,
        Long workerId,
        String workerName,
        Integer etaMinutes,
        Double routeDistanceKm,
        Double score,
        JsonNode reasonJson
    ) {}
}
