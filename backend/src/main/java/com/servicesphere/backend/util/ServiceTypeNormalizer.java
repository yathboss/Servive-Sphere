package com.servicesphere.backend.util;

import java.util.List;

public final class ServiceTypeNormalizer {

    private ServiceTypeNormalizer() {
    }

    public static String canonicalize(String rawServiceType) {
        if (rawServiceType == null) {
            return "";
        }

        String normalized = rawServiceType.trim().toLowerCase();
        return switch (normalized) {
            case "plumber", "plumbing" -> "plumbing";
            case "electrician", "electrical" -> "electrical";
            case "cleaner", "cleaning", "housekeeping" -> "cleaning";
            case "hvac", "hvac tech", "hvac technician" -> "hvac";
            case "carpenter", "carpentry" -> "carpentry";
            case "landscaper", "landscaping" -> "landscaping";
            case "roofer", "roofing" -> "roofing";
            case "painter", "painting" -> "painting";
            default -> normalized;
        };
    }

    public static String toDisplayLabel(String rawServiceType) {
        return switch (canonicalize(rawServiceType)) {
            case "plumbing" -> "Plumbing";
            case "electrical" -> "Electrical";
            case "cleaning" -> "Cleaning";
            case "hvac" -> "HVAC";
            case "carpentry" -> "Carpentry";
            case "landscaping" -> "Landscaping";
            case "roofing" -> "Roofing";
            case "painting" -> "Painting";
            default -> rawServiceType == null || rawServiceType.isBlank()
                ? "General"
                : rawServiceType.trim();
        };
    }

    public static boolean matchesSkill(List<String> skills, String requestedServiceType) {
        String requested = canonicalize(requestedServiceType);
        if (requested.isBlank() || skills == null || skills.isEmpty()) {
            return false;
        }

        return skills.stream()
            .map(ServiceTypeNormalizer::canonicalize)
            .anyMatch(requested::equals);
    }
}
