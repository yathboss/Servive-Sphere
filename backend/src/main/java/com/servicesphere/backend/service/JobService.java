package com.servicesphere.backend.service;

import com.servicesphere.backend.dto.JobCreate;
import com.servicesphere.backend.dto.JobResponse;
import com.servicesphere.backend.model.Job;
import com.servicesphere.backend.model.User;
import com.servicesphere.backend.repository.JobRepository;
import com.servicesphere.backend.repository.UserRepository;
import com.servicesphere.backend.util.ServiceTypeNormalizer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class JobService {

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private UserRepository userRepository;

    public JobResponse createJob(JobCreate dto) {
        User user;
        if (dto.getUserId() != null) {
            user = userRepository.findById(dto.getUserId())
                .orElseGet(() -> {
                    User u = new User();
                    u.setName("Current User");
                    return userRepository.save(u);
                });
        } else {
            User u = new User();
            u.setName("Current User");
            user = userRepository.save(u);
        }

        Job job = new Job();
        job.setUser(user);
        job.setServiceType(ServiceTypeNormalizer.toDisplayLabel(dto.getServiceType()));
        job.setPreferredWorkerId(dto.getPreferredWorkerId());
        job.setUserLat(dto.getUserLat());
        job.setUserLon(dto.getUserLon());
        job.setPriority(dto.getPriority() != null ? dto.getPriority() : 3);
        if (dto.getDeadlineMinutes() != null) {
            job.setDeadlineTs(LocalDateTime.now().plusMinutes(dto.getDeadlineMinutes()));
        }
        job.setBudgetOptional(dto.getBudgetOptional());
        
        Job saved = jobRepository.save(job);
        
        JobResponse resp = new JobResponse();
        resp.setId(saved.getId());
        resp.setServiceType(saved.getServiceType());
        resp.setPriority(saved.getPriority());
        resp.setStatus(saved.getStatus());
        resp.setCreatedAt(saved.getCreatedAt());
        
        return resp;
    }
}
