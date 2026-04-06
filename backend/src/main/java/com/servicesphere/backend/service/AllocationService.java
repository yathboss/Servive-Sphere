package com.servicesphere.backend.service;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.servicesphere.backend.algorithms.SchedulingEngine;
import com.servicesphere.backend.algorithms.GraphLoader;
import com.servicesphere.backend.dto.AssignmentResponse;
import com.servicesphere.backend.model.Assignment;
import com.servicesphere.backend.model.Job;
import com.servicesphere.backend.model.Worker;
import com.servicesphere.backend.repository.AssignmentRepository;
import com.servicesphere.backend.repository.JobRepository;
import com.servicesphere.backend.repository.WorkerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.Map;

@Service
public class AllocationService {

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private WorkerRepository workerRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private SchedulingEngine schedulingEngine;

    @Autowired
    private GraphLoader graphLoader;

    @PostConstruct
    public void init() {
        schedulingEngine.setRoadGraph(graphLoader.loadGraph("classpath:road_graph.json"));
    }

    @Transactional
    public Map<String, Object> allocatePendingJobs() {
        List<Job> pendingJobs = jobRepository.findByStatus("pending");
        if (pendingJobs.isEmpty()) {
            return Map.of("message", "No pending jobs", "allocations", List.of());
        }

        List<Worker> availableWorkers = workerRepository.findByIsAvailableTrue();

        long startTime = System.currentTimeMillis();
        List<AssignmentResponse> allocations = schedulingEngine.allocateJobs(pendingJobs, availableWorkers);
        long runtime = System.currentTimeMillis() - startTime;

        if (allocations.isEmpty()) {
            return Map.of("message", "Could not allocate any jobs", "allocations", List.of());
        }

        for (AssignmentResponse allocDto : allocations) {
            Job job = jobRepository.findById(allocDto.getJobId()).orElseThrow();
            Worker worker = workerRepository.findById(allocDto.getWorkerId()).orElseThrow();

            Assignment assignment = new Assignment();
            assignment.setJob(job);
            assignment.setWorker(worker);
            assignment.setEtaMinutes(allocDto.getEtaMinutes());
            assignment.setRouteDistanceKm(allocDto.getRouteDistanceKm());
            assignment.setScore(allocDto.getScore());
            assignment.setReasonJson(allocDto.getReasonJson());

            job.setStatus("assigned");
            job.setAssignment(assignment);
            
            worker.setLoadCount((worker.getLoadCount() != null ? worker.getLoadCount() : 0) + 1);

            assignmentRepository.save(assignment);
            jobRepository.save(job);
            workerRepository.save(worker);
            
            allocDto.setId(assignment.getId());
            allocDto.setAssignedAt(assignment.getAssignedAt());
        }

        return Map.of(
            "message", "Allocated " + allocations.size() + " jobs",
            "allocations", allocations,
            "metrics", Map.of("runtime_ms", runtime)
        );
    }
}
