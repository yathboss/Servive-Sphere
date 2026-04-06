package com.servicesphere.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class WorkerCreate {
    private String name;
    private String email;
    private String phone;
    private String city;
    private String bio;
    private List<String> skills;
    private List<String> serviceAreas;
    private Double basePrice;
    private Double lat;
    private Double lon;
    private Boolean isAvailable;
}
