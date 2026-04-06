package com.servicesphere.backend.repository;

import com.servicesphere.backend.model.Worker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface WorkerRepository extends JpaRepository<Worker, Long> {
    
    @Query("SELECT DISTINCT w FROM Worker w JOIN w.skills s WHERE LOWER(s) = LOWER(:skill) AND w.isAvailable = true")
    List<Worker> findAvailableBySkill(@Param("skill") String skill);
    
    List<Worker> findByIsAvailableTrue();
    long countByIsAvailableTrue();
    long countByIsAvailableFalse();
    long countByIsAvailableTrueAndLoadCountGreaterThan(Integer loadCount);
}
