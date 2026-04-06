package com.servicesphere.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class JobCreate {
    private Long userId;
    private Long preferredWorkerId;
    private String serviceType;
    private Double userLat;
    private Double userLon;
    private Integer priority = 3;
    private Integer deadlineMinutes;
    private Double budgetOptional;
}
