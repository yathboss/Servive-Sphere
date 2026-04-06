package com.servicesphere.backend.algorithms;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GraphNode {
    private String id;
    private double lat;
    private double lon;
}
