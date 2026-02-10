package com.ecotrack.backend.controller;

import com.ecotrack.backend.model.Facility;
import com.ecotrack.backend.repository.FacilityRepository;
import com.ecotrack.backend.service.FacilityMatchingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/facilities")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"})
public class FacilityManagementController {

    @Autowired
    private FacilityRepository facilityRepository;

    @Autowired
    private FacilityMatchingService facilityMatchingService;

    @GetMapping
    public List<Facility> getAllFacilities() {
        return facilityRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Facility> getFacilityById(@PathVariable Long id) {
        Optional<Facility> facility = facilityRepository.findById(id);
        return facility.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/type/{type}")
    public List<Facility> getFacilitiesByType(@PathVariable String type) {
        return facilityRepository.findByType(type);
    }

    @GetMapping("/active")
    public List<Facility> getActiveFacilities() {
        return facilityRepository.findByIsActive(true);
    }

    @GetMapping("/nearest")
    public Facility getNearestFacility(
            @RequestParam String type,
            @RequestParam double lat,
            @RequestParam double lng) {
        List<Facility> facilities = facilityRepository.findByType(type);
        return facilityMatchingService.findNearestFacility(type, lat, lng, facilities);
    }

    @PostMapping
    public ResponseEntity<Facility> createFacility(@RequestBody Facility facility) {
        Facility savedFacility = facilityRepository.save(facility);
        return ResponseEntity.ok(savedFacility);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Facility> updateFacility(@PathVariable Long id, @RequestBody Facility facilityDetails) {
        Optional<Facility> facility = facilityRepository.findById(id);
        if (facility.isPresent()) {
            Facility existingFacility = facility.get();
            if (facilityDetails.getName() != null) existingFacility.setName(facilityDetails.getName());
            if (facilityDetails.getType() != null) existingFacility.setType(facilityDetails.getType());
            existingFacility.setLatitude(facilityDetails.getLatitude());
            existingFacility.setLongitude(facilityDetails.getLongitude());
            if (facilityDetails.getPhoneNumber() != null) existingFacility.setPhoneNumber(facilityDetails.getPhoneNumber());
            existingFacility.setCurrentUsageKg(facilityDetails.getCurrentUsageKg());
            existingFacility.setActive(facilityDetails.isActive());
            
            Facility updatedFacility = facilityRepository.save(existingFacility);
            return ResponseEntity.ok(updatedFacility);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFacility(@PathVariable Long id) {
        facilityRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
