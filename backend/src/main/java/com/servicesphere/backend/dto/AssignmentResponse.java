package com.servicesphere.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;
import com.fasterxml.jackson.databind.JsonNode;

@Data
public class AssignmentResponse {
    private Long id;
    private Long jobId;
    private Long workerId;
    private LocalDateTime assignedAt;
    private Integer etaMinutes;
    private Double routeDistanceKm;
    private Double score;
    private JsonNode reasonJson;
}
