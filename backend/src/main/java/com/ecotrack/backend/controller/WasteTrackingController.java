package com.ecotrack.backend.controller;

import com.ecotrack.backend.dto.WasteCreateRequest;
import com.ecotrack.backend.model.Role;
import com.ecotrack.backend.model.User;
import com.ecotrack.backend.model.Waste;
import com.ecotrack.backend.repository.UserRepository;
import com.ecotrack.backend.repository.WasteRepository;
import com.ecotrack.backend.service.WasteValidationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/waste")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://127.0.0.1:5173"})
public class WasteTrackingController {

    @Autowired
    private WasteRepository wasteRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WasteValidationService wasteValidationService;

    @GetMapping
    public List<Waste> getAllWaste() {
        return wasteRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Waste> getWasteById(@PathVariable Long id) {
        Optional<Waste> waste = wasteRepository.findById(id);
        return waste.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public List<Waste> getWasteByUserId(@PathVariable Long userId) {
        return wasteRepository.findByUserId(userId);
    }

    @GetMapping("/type/{type}")
    public List<Waste> getWasteByType(@PathVariable String type) {
        return wasteRepository.findByType(type);
    }

    @GetMapping("/status/{status}")
    public List<Waste> getWasteByStatus(@PathVariable String status) {
        return wasteRepository.findByStatus(status);
    }

    @PostMapping
    public ResponseEntity<?> createWaste(@RequestBody WasteCreateRequest request) {
        try {
            // CRITICAL VALIDATION - Makes invalid waste entries impossible
            List<String> validationErrors = wasteValidationService.validateWasteRequest(request);
            if (!validationErrors.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Validation failed",
                    "details", validationErrors
                ));
            }
            
            // Find the user by ID (already validated by service)
            Optional<User> userOptional = userRepository.findById(request.getUserId());
            if (!userOptional.isPresent()) {
                return ResponseEntity.badRequest().body("User not found with ID: " + request.getUserId());
            }

            User user = userOptional.get();

            // Create new Waste entity
            Waste waste = new Waste();
            waste.setUser(user);
            waste.setType(request.getType());
            waste.setQuantity(request.getQuantity());
            waste.setDescription(request.getDescription());
            waste.setLocationLatitude(request.getLocationLatitude());
            waste.setLocationLongitude(request.getLocationLongitude());
            waste.setLocationAddress(request.getLocationAddress());
            waste.setImageUrl(request.getImageUrl()); // Set image URL if provided
            waste.setStatus(request.getStatus() != null ? request.getStatus() : "PENDING");
            waste.setCreatedAt(LocalDateTime.now());
            waste.setUpdatedAt(LocalDateTime.now());

            Waste savedWaste = wasteRepository.save(waste);
            return ResponseEntity.ok(savedWaste);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating waste entry: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateWaste(@PathVariable Long id, @RequestBody Waste wasteDetails, 
                                        @RequestParam(required = false) Long currentUserId) {
        Optional<Waste> waste = wasteRepository.findById(id);
        if (waste.isPresent()) {
            Waste existingWaste = waste.get();
            
            // Role-based access control for status updates
            if (wasteDetails.getStatus() != null && currentUserId != null) {
                Optional<User> currentUser = userRepository.findById(currentUserId);
                if (currentUser.isPresent()) {
                    Role userRole = currentUser.get().getRole();
                    // Only COLLECTOR and ADMIN can update status
                    if (userRole == Role.DONOR) {
                        return ResponseEntity.status(403).body("Donors cannot update waste status");
                    }
                }
            }
            
            if (wasteDetails.getType() != null) existingWaste.setType(wasteDetails.getType());
            if (wasteDetails.getDescription() != null) existingWaste.setDescription(wasteDetails.getDescription());
            existingWaste.setQuantity(wasteDetails.getQuantity());
            existingWaste.setLocationLatitude(wasteDetails.getLocationLatitude());
            existingWaste.setLocationLongitude(wasteDetails.getLocationLongitude());
            if (wasteDetails.getStatus() != null) existingWaste.setStatus(wasteDetails.getStatus());
            
            Waste updatedWaste = wasteRepository.save(existingWaste);
            return ResponseEntity.ok(updatedWaste);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWaste(@PathVariable Long id) {
        wasteRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/analytics/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserAnalytics(@PathVariable Long userId, 
                                                               @RequestParam(defaultValue = "month") String timeRange) {
        try {
            List<Waste> userWaste = wasteRepository.findByUserId(userId);
            
            // Calculate date range
            LocalDateTime endDate = LocalDateTime.now();
            LocalDateTime startDate;
            
            switch (timeRange.toLowerCase()) {
                case "week":
                    startDate = endDate.minus(7, ChronoUnit.DAYS);
                    break;
                case "year":
                    startDate = endDate.minus(1, ChronoUnit.YEARS);
                    break;
                default: // month
                    startDate = endDate.minus(30, ChronoUnit.DAYS);
            }
            
            // Filter waste entries by date range
            List<Waste> filteredWaste = userWaste.stream()
                    .filter(waste -> waste.getCreatedAt().isAfter(startDate))
                    .collect(Collectors.toList());
            
            // Calculate statistics
            double totalWaste = filteredWaste.stream()
                    .mapToDouble(Waste::getQuantity)
                    .sum();
            
            Map<String, Double> wasteByCategory = filteredWaste.stream()
                    .collect(Collectors.groupingBy(
                            Waste::getType,
                            Collectors.summingDouble(Waste::getQuantity)
                    ));
            
            Map<String, Long> wasteByStatus = filteredWaste.stream()
                    .collect(Collectors.groupingBy(
                            Waste::getStatus,
                            Collectors.counting()
                    ));
            
            // Calculate previous period for comparison
            LocalDateTime prevStartDate = startDate.minus(
                    ChronoUnit.DAYS.between(startDate, endDate), ChronoUnit.DAYS);
            LocalDateTime prevEndDate = startDate;
            
            List<Waste> previousWaste = userWaste.stream()
                    .filter(waste -> waste.getCreatedAt().isAfter(prevStartDate) && waste.getCreatedAt().isBefore(prevEndDate))
                    .collect(Collectors.toList());
            
            double previousTotal = previousWaste.stream()
                    .mapToDouble(Waste::getQuantity)
                    .sum();
            
            double changePercentage = previousTotal > 0 ? 
                    ((totalWaste - previousTotal) / previousTotal) * 100 : 0;
            
            Map<String, Object> analytics = new HashMap<>();
            analytics.put("totalWaste", Math.round(totalWaste * 100.0) / 100.0);
            analytics.put("entryCount", filteredWaste.size());
            analytics.put("wasteByCategory", wasteByCategory);
            analytics.put("wasteByStatus", wasteByStatus);
            analytics.put("changePercentage", Math.round(changePercentage * 100.0) / 100.0);
            analytics.put("timeRange", timeRange);
            analytics.put("startDate", startDate);
            analytics.put("endDate", endDate);
            
            return ResponseEntity.ok(analytics);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to get user analytics: " + e.getMessage()));
        }
    }

    @GetMapping("/analytics/trends/{userId}")
    public ResponseEntity<Map<String, Object>> getUserTrends(@PathVariable Long userId,
                                                            @RequestParam(defaultValue = "month") String timeRange) {
        try {
            List<Waste> userWaste = wasteRepository.findByUserId(userId);
            
            LocalDateTime endDate = LocalDateTime.now();
            LocalDateTime startDate;
            int periods;
            String periodLabel;
            
            switch (timeRange.toLowerCase()) {
                case "week":
                    startDate = endDate.minus(7, ChronoUnit.DAYS);
                    periods = 7;
                    periodLabel = "Day";
                    break;
                case "year":
                    startDate = endDate.minus(12, ChronoUnit.MONTHS);
                    periods = 12;
                    periodLabel = "Month";
                    break;
                default: // month
                    startDate = endDate.minus(4, ChronoUnit.WEEKS);
                    periods = 4;
                    periodLabel = "Week";
            }
            
            // Create time series data
            List<Map<String, Object>> trendData = new java.util.ArrayList<>();
            
            for (int i = 0; i < periods; i++) {
                LocalDateTime periodStart, periodEnd;
                String label;
                
                if (timeRange.equals("week")) {
                    periodStart = startDate.plus(i, ChronoUnit.DAYS);
                    periodEnd = periodStart.plus(1, ChronoUnit.DAYS);
                    label = periodStart.getDayOfWeek().toString().substring(0, 3);
                } else if (timeRange.equals("year")) {
                    periodStart = startDate.plus(i, ChronoUnit.MONTHS);
                    periodEnd = periodStart.plus(1, ChronoUnit.MONTHS);
                    label = periodStart.getMonth().toString().substring(0, 3);
                } else {
                    periodStart = startDate.plus(i, ChronoUnit.WEEKS);
                    periodEnd = periodStart.plus(1, ChronoUnit.WEEKS);
                    label = "Week " + (i + 1);
                }
                
                double periodWaste = userWaste.stream()
                        .filter(waste -> waste.getCreatedAt().isAfter(periodStart) && waste.getCreatedAt().isBefore(periodEnd))
                        .mapToDouble(Waste::getQuantity)
                        .sum();
                
                Map<String, Object> periodData = new HashMap<>();
                periodData.put("period", label);
                periodData.put("waste", Math.round(periodWaste * 100.0) / 100.0);
                periodData.put("startDate", periodStart);
                periodData.put("endDate", periodEnd);
                
                trendData.add(periodData);
            }
            
            Map<String, Object> trends = new HashMap<>();
            trends.put("timeRange", timeRange);
            trends.put("periodLabel", periodLabel);
            trends.put("trends", trendData);
            
            return ResponseEntity.ok(trends);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to get user trends: " + e.getMessage()));
        }
    }

    @GetMapping("/analytics/global")
    public ResponseEntity<Map<String, Object>> getGlobalAnalytics() {
        try {
            List<Waste> allWaste = wasteRepository.findAll();
            
            double totalGlobalWaste = allWaste.stream()
                    .mapToDouble(Waste::getQuantity)
                    .sum();
            
            Map<String, Double> globalByCategory = allWaste.stream()
                    .collect(Collectors.groupingBy(
                            Waste::getType,
                            Collectors.summingDouble(Waste::getQuantity)
                    ));
            
            long totalUsers = allWaste.stream()
                    .map(waste -> waste.getUser().getId())
                    .distinct()
                    .count();
            
            Map<String, Object> globalAnalytics = new HashMap<>();
            globalAnalytics.put("totalWaste", Math.round(totalGlobalWaste * 100.0) / 100.0);
            globalAnalytics.put("totalEntries", allWaste.size());
            globalAnalytics.put("activeUsers", totalUsers);
            globalAnalytics.put("wasteByCategory", globalByCategory);
            globalAnalytics.put("averagePerUser", totalUsers > 0 ? Math.round((totalGlobalWaste / totalUsers) * 100.0) / 100.0 : 0);
            
            return ResponseEntity.ok(globalAnalytics);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to get global analytics: " + e.getMessage()));
        }
    }
}
