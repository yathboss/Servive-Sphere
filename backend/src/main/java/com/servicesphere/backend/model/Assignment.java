package com.servicesphere.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import com.fasterxml.jackson.databind.JsonNode;

@Entity
@Table(name = "assignments")
@Data
public class Assignment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne
    @JoinColumn(name = "job_id", unique = true)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("assignment")
    private Job job;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "worker_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("assignments")
    private Worker worker;
    
    @CreationTimestamp
    private LocalDateTime assignedAt;
    
    private Integer etaMinutes;
    private Double routeDistanceKm;
    private Double score;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private JsonNode reasonJson;
}
