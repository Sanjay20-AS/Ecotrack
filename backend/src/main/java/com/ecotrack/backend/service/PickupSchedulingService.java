package com.ecotrack.backend.service;

import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
public class PickupSchedulingService {

    public String schedulePickup(
            String wasteType,
            int quantity,
            int daysSinceGenerated,
            int availableSlots) {

        // If no slots available
        if (availableSlots <= 0) {
            return "NO SLOTS AVAILABLE – RESCHEDULE REQUIRED";
        }

        // FOOD waste logic
        if (wasteType.equalsIgnoreCase("FOOD")) {
            if (daysSinceGenerated <= 1 && quantity > 5) {
                return "IMMEDIATE PICKUP (WITHIN 6 HOURS)";
            } else if (daysSinceGenerated <= 3) {
                return "PRIORITY PICKUP (WITHIN 24 HOURS)";
            } else {
                return "STANDARD PICKUP (WITHIN 48 HOURS)";
            }
        }

        // E-WASTE logic
        if (wasteType.equalsIgnoreCase("E-WASTE")) {
            if (quantity > 10) {
                return "BULK E-WASTE PICKUP (WITHIN 2 DAYS)";
            } else {
                return "SCHEDULED PICKUP (WITHIN 3 DAYS)";
            }
        }

        return "PICKUP TYPE NOT SUPPORTED";
    }
}

