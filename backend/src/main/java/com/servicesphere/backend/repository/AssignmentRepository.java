package com.servicesphere.backend.repository;

import com.servicesphere.backend.model.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    Optional<Assignment> findByJobId(Long jobId);
    List<Assignment> findByWorkerIdOrderByJobDeadlineTsAsc(Long workerId);
    List<Assignment> findTop8ByOrderByAssignedAtDesc();
}
