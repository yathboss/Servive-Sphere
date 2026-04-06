package com.servicesphere.backend.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;
import com.fasterxml.jackson.databind.JsonNode;

@Data
@EqualsAndHashCode(callSuper = true)
public class RankedWorkerResponse extends WorkerResponse {
    private Double haversineDistance;
    private Double routeDistance;
    private Double score;
    private JsonNode scoreBreakdown;
}
