package com.servicesphere.backend.algorithms;

import java.util.*;

public class RoadGraph {
    private Map<String, GraphNode> nodes = new HashMap<>();
    private Map<String, List<GraphEdge>> adjList = new HashMap<>();

    public void addNode(GraphNode node) {
        nodes.put(node.getId(), node);
        adjList.putIfAbsent(node.getId(), new ArrayList<>());
    }

    public void addEdge(GraphEdge edge) {
        adjList.get(edge.getU()).add(edge);
        adjList.get(edge.getV()).add(new GraphEdge(edge.getV(), edge.getU(), edge.getWeight()));
    }

    public GraphNode getNode(String id) {
        return nodes.get(id);
    }

    public Collection<GraphNode> getAllNodes() {
        return nodes.values();
    }

    public List<GraphEdge> getNeighbors(String nodeId) {
        return adjList.getOrDefault(nodeId, new ArrayList<>());
    }
}
