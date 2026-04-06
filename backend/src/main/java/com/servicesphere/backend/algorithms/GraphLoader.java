package com.servicesphere.backend.algorithms;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;

@Component
public class GraphLoader {

    private final ObjectMapper mapper = new ObjectMapper();
    private final ResourceLoader resourceLoader;

    public GraphLoader(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    public RoadGraph loadGraph(String location) {
        RoadGraph roadGraph = new RoadGraph();

        Resource resource = resourceLoader.getResource(location);
        if (!resource.exists()) {
            System.err.println("Warning: Could not load road graph because the resource does not exist: " + location);
            return roadGraph;
        }

        try (InputStream inputStream = resource.getInputStream()) {
            JsonNode root = mapper.readTree(inputStream);

            JsonNode nodesNode = root.get("nodes");
            if (nodesNode != null && nodesNode.isArray()) {
                for (JsonNode n : nodesNode) {
                    roadGraph.addNode(new GraphNode(n.get("id").asText(), n.get("lat").asDouble(), n.get("lon").asDouble()));
                }
            }
            
            JsonNode edgesNode = root.get("edges");
            if (edgesNode != null && edgesNode.isArray()) {
                for (JsonNode e : edgesNode) {
                    roadGraph.addEdge(new GraphEdge(e.get("u").asText(), e.get("v").asText(), e.get("weight").asDouble()));
                }
            }
        } catch (IOException e) {
            System.err.println("Warning: Could not load road graph from " + location + ": " + e.getMessage());
        }
        return roadGraph;
    }
}
