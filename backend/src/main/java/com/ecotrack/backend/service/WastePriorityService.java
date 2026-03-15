package com.ecotrack.backend.service;

import org.springframework.stereotype.Service;

@Service
public class WastePriorityService {

    public double calculatePriority(
            String wasteType,
            double quantity,
            int daysSincePosted,
            double distanceKm) {

        double weightFactor;
        switch (wasteType.toUpperCase()) {
            case "FOOD":    weightFactor = 2.0; break;   // perishable — highest priority
            case "E-WASTE": weightFactor = 1.8; break;   // hazardous components
            case "PLASTIC": weightFactor = 1.2; break;
            case "PAPER":   weightFactor = 1.0; break;
            case "ORGANIC": weightFactor = 1.6; break;   // decomposes if left
            default:        weightFactor = 1.5;
        }
        double urgencyFactor = daysSincePosted * 1.2;
        double distancePenalty = distanceKm * 0.5;

        return (quantity * weightFactor) + urgencyFactor - distancePenalty;
    }
}
