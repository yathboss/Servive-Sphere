package com.servicesphere.backend.service;

import com.servicesphere.backend.model.Job;
import com.servicesphere.backend.model.User;
import com.servicesphere.backend.model.Worker;
import com.servicesphere.backend.repository.AssignmentRepository;
import com.servicesphere.backend.repository.JobRepository;
import com.servicesphere.backend.repository.UserRepository;
import com.servicesphere.backend.repository.WorkerRepository;
import com.servicesphere.backend.util.ServiceTypeNormalizer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
public class SeedService {

    private record DemoUserSeed(String name, String phone) {
    }

    @Autowired
    private WorkerRepository workerRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Transactional
    public String seedData() {
        assignmentRepository.deleteAll();
        jobRepository.deleteAll();
        workerRepository.deleteAll();
        userRepository.deleteAll();

        List<Worker> workers = new ArrayList<>();
        Random rand = new Random(42);
        List<String> services = List.of(
            "Plumbing",
            "Electrical",
            "HVAC",
            "Carpentry",
            "Cleaning",
            "Landscaping",
            "Roofing",
            "Painting"
        );

        List<User> demoUsers = userRepository.saveAll(List.of(
            createUser(new DemoUserSeed("Aarav Mehta", "+1-415-555-0101")),
            createUser(new DemoUserSeed("Sophia Nguyen", "+1-415-555-0102")),
            createUser(new DemoUserSeed("Liam Carter", "+1-415-555-0103")),
            createUser(new DemoUserSeed("Isabella Khan", "+1-415-555-0104")),
            createUser(new DemoUserSeed("Noah Patel", "+1-415-555-0105")),
            createUser(new DemoUserSeed("Mia Thompson", "+1-415-555-0106"))
        ));
        
        for (int i = 0; i < 100; i++) {
            Worker w = new Worker();
            w.setName("Worker " + i);
            w.setSkills(List.of(ServiceTypeNormalizer.toDisplayLabel(services.get(rand.nextInt(services.size())))));
            w.setBasePrice(40.0 + rand.nextDouble() * 110);
            w.setRatingAvg(3.0 + rand.nextDouble() * 2);
            w.setJobsCompleted(rand.nextInt(50));
            w.setLat(37.7749 + (rand.nextDouble() - 0.5) * 0.14);
            w.setLon(-122.4194 + (rand.nextDouble() - 0.5) * 0.14);
            w.setIsAvailable(true);
            w.setLoadCount(0);
            workers.add(w);
        }
        workerRepository.saveAll(workers);
        
        List<Job> jobs = new ArrayList<>();
        for (int i=0; i<200; i++) {
            Job j = new Job();
            j.setServiceType(ServiceTypeNormalizer.toDisplayLabel(services.get(rand.nextInt(services.size()))));
            j.setUserLat(37.7749 + (rand.nextDouble() - 0.5) * 0.12);
            j.setUserLon(-122.4194 + (rand.nextDouble() - 0.5) * 0.12);
            j.setPriority(rand.nextInt(5) + 1);
            j.setStatus("pending");
            j.setUser(demoUsers.get(rand.nextInt(demoUsers.size())));
            jobs.add(j);
        }
        jobRepository.saveAll(jobs);
        
        return "Reset and seeded " + workers.size() + " workers, " + jobs.size() + " jobs, and " + demoUsers.size() + " demo users around San Francisco.";
    }

    private User createUser(DemoUserSeed seed) {
        User user = new User();
        user.setName(seed.name());
        user.setPhone(seed.phone());
        return user;
    }
}
