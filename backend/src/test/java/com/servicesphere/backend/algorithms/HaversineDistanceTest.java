package com.servicesphere.backend.algorithms;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class HaversineDistanceTest {
    @Test
    public void testDistance() {
        double dist = HaversineDistance.calculate(37.7749, -122.4194, 34.0522, -118.2437);
        assertTrue(dist > 500 && dist < 600); // Approx 559 km from SF to LA
    }
}
