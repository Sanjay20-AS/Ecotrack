package com.ecotrack.backend.controller;

import com.ecotrack.backend.service.PickupSchedulingService;
import com.ecotrack.backend.service.WastePriorityService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/waste")
public class WasteController {

    private final WastePriorityService service;
    private final PickupSchedulingService pickupSchedulingService;

    public WasteController(WastePriorityService service, PickupSchedulingService pickupSchedulingService) {
        this.service = service;
        this.pickupSchedulingService = pickupSchedulingService;
    }

    @GetMapping("/priority")
public Map<String, Object> calculatePriority(
        @RequestParam String type,
        @RequestParam double quantity,
        @RequestParam int days,
        @RequestParam double distance) {

    double score = service.calculatePriority(type, quantity, days, distance);

    Map<String, Object> response = new HashMap<>();
    response.put("wasteType", type);
    response.put("quantity", quantity);
    response.put("daysSinceGenerated", days);
    response.put("distanceKm", distance);
    response.put("priorityScore", score);
    response.put("priorityLevel", score > 50 ? "HIGH" : "LOW");

    return response;
}

    @GetMapping("/pickup-schedule")
public Map<String, Object> schedulePickup(
        @RequestParam String type,
        @RequestParam int quantity,
        @RequestParam int days,
        @RequestParam int availableSlots) {

    String schedule = pickupSchedulingService.schedulePickup(
            type, quantity, days, availableSlots
    );

    Map<String, Object> response = new HashMap<>();
    response.put("wasteType", type);
    response.put("quantity", quantity);
    response.put("daysSinceGenerated", days);
    response.put("availablePickupSlots", availableSlots);

    DateTimeFormatter formatter =
            DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");
    response.put(
            "currentDateTime",
            LocalDateTime.now().format(formatter)
    );

    response.put("pickupSchedule", schedule);

    return response;
}

}



