package com.ecotrack.backend.controller;

import com.ecotrack.backend.model.Facility;
import com.ecotrack.backend.repository.FacilityRepository;
import com.ecotrack.backend.service.FacilityMatchingService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/waste")
public class FacilityController {

    private final FacilityMatchingService facilityMatchingService;
    private final FacilityRepository facilityRepository;

    public FacilityController(FacilityMatchingService facilityMatchingService, FacilityRepository facilityRepository) {
        this.facilityMatchingService = facilityMatchingService;
        this.facilityRepository = facilityRepository;
    }

    @GetMapping("/nearest-facility")
    public Facility getNearestFacility(
            @RequestParam String type,
            @RequestParam double lat,
            @RequestParam double lng) {

        List<Facility> facilities = facilityRepository.findAll();
        
        if (facilities.isEmpty()) {
            // Fallback to hardcoded data if no facilities in database
            facilities = List.of(
                new Facility("NGO A", "FOOD", 12.9716, 77.5946),
                new Facility("Recycler B", "EWASTE", 12.9352, 77.6245),
                new Facility("Compost Site", "COMPOST", 12.9600, 77.5900)
            );
        }

        return facilityMatchingService.findNearestFacility(type, lat, lng, facilities);
    }
}

