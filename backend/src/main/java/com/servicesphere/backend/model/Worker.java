package com.servicesphere.backend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Entity
@Table(name = "workers")
@Data
public class Worker {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;

    private String email;
    private String phone;
    private String city;

    @Column(length = 1200)
    private String bio;
    
    @ElementCollection
    @CollectionTable(name = "worker_skills", joinColumns = @JoinColumn(name = "worker_id"))
    @Column(name = "skill")
    private List<String> skills;

    @ElementCollection
    @CollectionTable(name = "worker_service_areas", joinColumns = @JoinColumn(name = "worker_id"))
    @Column(name = "service_area")
    private List<String> serviceAreas;
    
    private Double basePrice = 0.0;
    private Double ratingAvg = 0.0;
    private Integer jobsCompleted = 0;
    
    @Column(nullable = false)
    private Double lat;
    
    @Column(nullable = false)
    private Double lon;
    
    private Boolean isAvailable = true;
    private Integer loadCount = 0;
}
