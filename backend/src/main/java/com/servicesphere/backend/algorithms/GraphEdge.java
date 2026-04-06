package com.servicesphere.backend.algorithms;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GraphEdge {
    private String u;
    private String v;
    private double weight;
}
