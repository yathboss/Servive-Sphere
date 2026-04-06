package com.servicesphere.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class WorkerResponse {
    private Long id;
    private String name;
    private List<String> skills;
    private Double basePrice;
    private Double ratingAvg;
    private Integer jobsCompleted;
    private Double lat;
    private Double lon;
    private Boolean isAvailable;
    private Integer loadCount;
}
