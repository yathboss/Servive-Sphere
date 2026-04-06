package com.servicesphere.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class JobResponse {
    private Long id;
    private String serviceType;
    private Integer priority;
    private String status;
    private LocalDateTime createdAt;
}
