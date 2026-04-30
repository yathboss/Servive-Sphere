package com.servicesphere.backend.algorithms;

import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class DijkstraAlgorithm {

    public String findNearestNode(RoadGraph graph, double lat, double lon) {
        double minDist = Double.MAX_VALUE;
        String nearestId = null;

        for(GraphNode node : graph.getAllNodes()) {
            double dist = Math.hypot(lat - node.getLat(), lon - node.getLon());
            if (dist < minDist) {
                minDist = dist;
                nearestId = node.getId();
            }
        }
        return nearestId;
    }

    public double calculateShortestPath(RoadGraph graph, String startNodeId, String targetNodeId) throws Exception {
        if (startNodeId.equals(targetNodeId)) return 0.0;

        Map<String, Double> distances = new HashMap<>();
        PriorityQueue<NodeDistance> pq = new PriorityQueue<>(Comparator.comparingDouble(nd -> nd.distance));

        for (GraphNode node : graph.getAllNodes()) {
            distances.put(node.getId(), Double.MAX_VALUE);
        }

        distances.put(startNodeId, 0.0);
        pq.add(new NodeDistance(startNodeId, 0.0));

        Set<String> visited = new HashSet<>();

        while (!pq.isEmpty()) {
            NodeDistance current = pq.poll();
            String u = current.nodeId;

            if (u.equals(targetNodeId)) {
                return current.distance;
            }

            if (visited.contains(u)) continue;
            visited.add(u);

            for (GraphEdge edge : graph.getNeighbors(u)) {
                String v = edge.getV();
                if (visited.contains(v)) continue;

                double newDist = distances.get(u) + edge.getWeight();
                if (newDist < distances.get(v)) {
                    distances.put(v, newDist);
                    pq.add(new NodeDistance(v, newDist));
                }
            }
        }

        throw new Exception("No path found");
    }

    private static class NodeDistance {
        String nodeId;
        double distance;

        NodeDistance(String nodeId, double distance) {
            this.nodeId = nodeId;
            this.distance = distance;
        }
    }
}
