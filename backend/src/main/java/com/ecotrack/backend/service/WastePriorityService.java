package com.ecotrack.backend.service;

import org.springframework.stereotype.Service;

@Service
public class WastePriorityService {

    public double calculatePriority(
            String wasteType,
            double quantity,
            int daysSincePosted,
            double distanceKm) {

        double weightFactor = wasteType.equalsIgnoreCase("FOOD") ? 2.0 : 1.5;
        double urgencyFactor = daysSincePosted * 1.2;
        double distancePenalty = distanceKm * 0.5;

        return (quantity * weightFactor) + urgencyFactor - distancePenalty;
    }
}
