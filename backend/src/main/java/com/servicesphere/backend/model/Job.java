package com.servicesphere.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "jobs")
@Data
public class Job {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String serviceType;
    
    @Column(nullable = false)
    private Double userLat;
    
    @Column(nullable = false)
    private Double userLon;
    
    private Integer priority = 3;
    private LocalDateTime deadlineTs;
    private Double budgetOptional;
    private Long preferredWorkerId;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    private String status = "pending";
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("jobs")
    private User user;
    
    @OneToOne(mappedBy = "job", cascade = CascadeType.ALL)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("job")
    private Assignment assignment;
}
