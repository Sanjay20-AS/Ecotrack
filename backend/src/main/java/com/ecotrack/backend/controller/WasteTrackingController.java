package com.ecotrack.backend.controller;

import com.ecotrack.backend.dto.WasteCreateRequest;
import com.ecotrack.backend.model.AccountStatus;
import com.ecotrack.backend.model.Facility;
import com.ecotrack.backend.model.Role;
import com.ecotrack.backend.model.User;
import com.ecotrack.backend.model.Waste;
import com.ecotrack.backend.model.WasteClassification;
import com.ecotrack.backend.repository.FacilityRepository;
import com.ecotrack.backend.repository.UserRepository;
import com.ecotrack.backend.repository.WasteClassificationRepository;
import com.ecotrack.backend.repository.WasteRepository;
import com.ecotrack.backend.service.FacilityMatchingService;
import com.ecotrack.backend.service.PickupSchedulingService;
import com.ecotrack.backend.service.NotificationService;
import com.ecotrack.backend.service.WastePriorityService;
import com.ecotrack.backend.service.WasteValidationService;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/waste")
public class WasteTrackingController {

    @Autowired
    private WasteRepository wasteRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WasteValidationService wasteValidationService;

    @Autowired
    private WastePriorityService wastePriorityService;

    @Autowired
    private PickupSchedulingService pickupSchedulingService;

    @Autowired
    private FacilityMatchingService facilityMatchingService;

    @Autowired
    private FacilityRepository facilityRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private com.ecotrack.backend.service.CarbonFootprintService carbonFootprintService;

    @Autowired
    private WasteClassificationRepository wasteClassificationRepository;

    @Value("${groq.api.key}")
    private String groqApiKey;

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
    public ResponseEntity<?> getWasteByUserId(@PathVariable Long userId) {
        try {
            List<Waste> wastes = wasteRepository.findByUserId(userId);
            return ResponseEntity.ok(wastes);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Failed to fetch waste entries for user",
                    "userId", userId,
                    "details", ex.getMessage()
            ));
        }
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

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateWasteStatus(@PathVariable Long id,
                                               @RequestBody Map<String, String> body,
                                               @RequestParam(required = false) Long currentUserId) {
        String newStatus = body.get("status");
        String collectorNotes = body.get("collectorNotes");
        String collectionPhotoUrl = body.get("collectionPhotoUrl");
        String collectorLatStr = body.get("collectorLatitude");
        String collectorLngStr = body.get("collectorLongitude");

        if (newStatus == null || newStatus.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
        }

        // ── Validate status value ──
        if (!"IN_PROGRESS".equals(newStatus) && !"COLLECTED".equals(newStatus) && !"PENDING".equals(newStatus)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid status. Must be PENDING, IN_PROGRESS, or COLLECTED"));
        }

        Optional<Waste> wasteOpt = wasteRepository.findById(id);
        if (wasteOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Waste entry not found"));
        }

        Waste waste = wasteOpt.get();

        // ── Role-based access control ──
        User currentUser = null;
        if (currentUserId != null) {
            Optional<User> userOpt = userRepository.findById(currentUserId);
            if (userOpt.isPresent()) {
                currentUser = userOpt.get();
                if (currentUser.getRole() == Role.DONOR) {
                    return ResponseEntity.status(403).body(Map.of("error", "Donors cannot update waste status"));
                }
                // Collectors must have ACTIVE account status
                if (currentUser.getRole() == Role.COLLECTOR) {
                    AccountStatus acctStatus = currentUser.getAccountStatus();
                    if (acctStatus == null || acctStatus == AccountStatus.PENDING_APPROVAL) {
                        return ResponseEntity.status(403).body(Map.of(
                                "error", "Your collector account is pending approval. You cannot claim or complete pickups until an admin activates your account.",
                                "accountStatus", "PENDING_APPROVAL"));
                    }
                    if (acctStatus == AccountStatus.REJECTED) {
                        return ResponseEntity.status(403).body(Map.of(
                                "error", "Your collector account has been rejected. Please contact support.",
                                "accountStatus", "REJECTED"));
                    }
                }
            }
        }

        // ══════════════════════════════════════════════════
        // STRICT STATUS TRANSITIONS (no skipping allowed)
        // ══════════════════════════════════════════════════

        String currentStatus = waste.getStatus();

        // ── PENDING → IN_PROGRESS (Claim) ──
        if ("IN_PROGRESS".equals(newStatus)) {
            if (!"PENDING".equals(currentStatus)) {
                return ResponseEntity.status(400).body(Map.of(
                        "error", "Invalid transition. Only PENDING waste can be claimed (current: " + currentStatus + ")",
                        "currentStatus", currentStatus));
            }
            if (waste.getCollectedBy() != null) {
                return ResponseEntity.status(409).body(Map.of(
                        "error", "This pickup has already been claimed by another collector"));
            }

            waste.setStatus("IN_PROGRESS");
            waste.setClaimedAt(LocalDateTime.now());
            waste.setUpdatedAt(LocalDateTime.now());
            if (currentUser != null) waste.setCollectedBy(currentUser);
            if (collectorNotes != null && currentUser != null && currentUser.getRole() != Role.DONOR) {
                waste.setCollectorNotes(collectorNotes);
            }
            Waste saved = wasteRepository.save(waste);

            // Notify donor that their waste was claimed
            if (saved.getUser() != null && currentUser != null) {
                notificationService.notifyDonorPickupClaimed(
                        saved.getUser(), saved.getType(), currentUser.getName());
            }

            return ResponseEntity.ok(saved);
        }

        // ── IN_PROGRESS → COLLECTED (Complete) ──
        if ("COLLECTED".equals(newStatus)) {
            if (!"IN_PROGRESS".equals(currentStatus)) {
                return ResponseEntity.status(400).body(Map.of(
                        "error", "Invalid transition. Only IN_PROGRESS waste can be marked collected (current: " + currentStatus + ")",
                        "currentStatus", currentStatus));
            }

            // Only the assigned collector can complete
            if (waste.getCollectedBy() != null && currentUserId != null
                    && !waste.getCollectedBy().getId().equals(currentUserId)) {
                return ResponseEntity.status(403).body(Map.of(
                        "error", "Only the assigned collector can mark this pickup as collected"));
            }

            // ── 5-minute minimum rule ──
            if (waste.getClaimedAt() != null) {
                long minutesSinceClaim = java.time.Duration.between(waste.getClaimedAt(), LocalDateTime.now()).toMinutes();
                if (minutesSinceClaim < 5) {
                    long remaining = 5 - minutesSinceClaim;
                    return ResponseEntity.status(400).body(Map.of(
                            "error", "You must wait at least 5 minutes after claiming before completing. " + remaining + " minute(s) remaining.",
                            "minutesRemaining", remaining,
                            "claimedAt", waste.getClaimedAt().toString()));
                }
            }

            // ── Mandatory photo ──
            if (collectionPhotoUrl == null || collectionPhotoUrl.isBlank()) {
                return ResponseEntity.status(400).body(Map.of(
                        "error", "A collection photo is required when marking as collected. Please upload a photo first."));
            }

            // ── Collector GPS required + distance check ──
            Double collectorLat = null;
            Double collectorLng = null;
            try {
                if (collectorLatStr != null) collectorLat = Double.parseDouble(collectorLatStr);
                if (collectorLngStr != null) collectorLng = Double.parseDouble(collectorLngStr);
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "The GPS coordinates provided are in an invalid format. Please try again or restart your app.",
                        "code", "INVALID_GPS_FORMAT"));
            }

            if (collectorLat == null || collectorLng == null) {
                return ResponseEntity.status(400).body(Map.of(
                        "error", "We couldn't determine your current location. Please make sure GPS/Location Services are turned on in your device settings, then try again.",
                        "code", "GPS_REQUIRED"));
            }

            // Distance validation: collector must be within 200m of pickup location
            double pickupLat = waste.getLocationLatitude();
            double pickupLng = waste.getLocationLongitude();
            if (pickupLat != 0 && pickupLng != 0) {
                double distanceMeters = haversineDistance(collectorLat, collectorLng, pickupLat, pickupLng);
                if (distanceMeters > 200) {
                    String distanceText;
                    if (distanceMeters >= 1000) {
                        distanceText = String.format("%.1f km", distanceMeters / 1000);
                    } else {
                        distanceText = Math.round(distanceMeters) + " meters";
                    }
                    return ResponseEntity.status(400).body(Map.of(
                            "error", "You appear to be " + distanceText + " away from the pickup location. You must be within 200 meters to complete collection. Please navigate closer to the pickup address and try again.",
                            "code", "TOO_FAR_FROM_PICKUP",
                            "distanceMeters", Math.round(distanceMeters),
                            "maxDistanceMeters", 200,
                            "pickupAddress", waste.getLocationAddress() != null ? waste.getLocationAddress() : "Unknown"));
                }
            }

            waste.setStatus("COLLECTED");
            waste.setUpdatedAt(LocalDateTime.now());
            waste.setCollectionPhotoUrl(collectionPhotoUrl);
            waste.setCollectorLatitude(collectorLat);
            waste.setCollectorLongitude(collectorLng);
            if (collectorNotes != null && currentUser != null && currentUser.getRole() != Role.DONOR) {
                waste.setCollectorNotes(collectorNotes);
            }
            Waste saved = wasteRepository.save(waste);

            // Notify donor that their waste was collected
            if (saved.getUser() != null) {
                String collectorName = currentUser != null ? currentUser.getName() : "A collector";
                notificationService.notifyDonorPickupCompleted(
                        saved.getUser(), saved.getType(), collectorName);
            }

            // Update carbon calculations for this waste and user's summary
            try {
                carbonFootprintService.calculateCarbonForWaste(saved);
                if (saved.getUser() != null) {
                    carbonFootprintService.updateUserCarbonSummary(saved.getUser().getId());
                }
            } catch (Exception ex) {
                // Do not block the response if carbon service fails; just log
                ex.printStackTrace();
            }

            return ResponseEntity.ok(saved);
        }

        // ── Any other transition (e.g. admin reset to PENDING) ──
        if ("PENDING".equals(newStatus)) {
            waste.setStatus("PENDING");
            waste.setCollectedBy(null);
            waste.setClaimedAt(null);
            waste.setCollectionPhotoUrl(null);
            waste.setCollectorLatitude(null);
            waste.setCollectorLongitude(null);
            waste.setCollectorNotes(null);
            waste.setUpdatedAt(LocalDateTime.now());
            Waste saved = wasteRepository.save(waste);
            return ResponseEntity.ok(saved);
        }

        return ResponseEntity.badRequest().body(Map.of("error", "Unhandled status transition"));
    }

    /**
     * Haversine formula: calculates distance in meters between two GPS coordinates.
     */
    private double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371000; // Earth radius in meters
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
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
                default: // month — current calendar month
                    startDate = YearMonth.now().atDay(1).atStartOfDay();
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
            analytics.put("co2Saved", Math.round(calculateCO2Saved(filteredWaste) * 100.0) / 100.0);
            
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
                default: // month — calendar weeks of current month
                    YearMonth currentMonth = YearMonth.now();
                    startDate = currentMonth.atDay(1).atStartOfDay();
                    int daysInMonth = currentMonth.lengthOfMonth();
                    periods = (int) Math.ceil(daysInMonth / 7.0);
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
                    // Calendar weeks: Week 1 = 1-7, Week 2 = 8-14, etc.
                    YearMonth cm = YearMonth.now();
                    int dayStart = i * 7 + 1;
                    int dayEnd = Math.min(dayStart + 7, cm.lengthOfMonth() + 1);
                    periodStart = cm.atDay(dayStart).atStartOfDay();
                    periodEnd = cm.atDay(Math.min(dayEnd, cm.lengthOfMonth())).atStartOfDay().plusDays(dayEnd > cm.lengthOfMonth() ? 0 : 0);
                    periodEnd = cm.atDay(Math.min(dayEnd - 1, cm.lengthOfMonth())).atTime(23, 59, 59);
                    label = "Week " + (i + 1);
                }

                final LocalDateTime pStart = periodStart;
                final LocalDateTime pEnd = periodEnd;
                double periodWaste = userWaste.stream()
                        .filter(waste -> waste.getCreatedAt().isAfter(pStart) && waste.getCreatedAt().isBefore(pEnd))
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

    // ── Collector-specific analytics ──

    @GetMapping("/analytics/collector/{collectorId}")
    public ResponseEntity<Map<String, Object>> getCollectorAnalytics(@PathVariable Long collectorId,
                                                                     @RequestParam(defaultValue = "month") String timeRange) {
        try {
            List<Waste> collectedWaste = wasteRepository.findByCollectedById(collectorId);

            LocalDateTime endDate = LocalDateTime.now();
            LocalDateTime startDate;

            switch (timeRange.toLowerCase()) {
                case "week":  startDate = endDate.minus(7, ChronoUnit.DAYS);  break;
                case "year":  startDate = endDate.minus(1, ChronoUnit.YEARS); break;
                default:      startDate = YearMonth.now().atDay(1).atStartOfDay();
            }

            List<Waste> filtered = collectedWaste.stream()
                    .filter(w -> w.getUpdatedAt() != null && w.getUpdatedAt().isAfter(startDate))
                    .collect(Collectors.toList());

            double totalWaste = filtered.stream().mapToDouble(Waste::getQuantity).sum();

            Map<String, Double> wasteByCategory = filtered.stream()
                    .collect(Collectors.groupingBy(Waste::getType, Collectors.summingDouble(Waste::getQuantity)));

            Map<String, Long> wasteByStatus = filtered.stream()
                    .collect(Collectors.groupingBy(Waste::getStatus, Collectors.counting()));

            // Previous period comparison
            long daysBetween = ChronoUnit.DAYS.between(startDate, endDate);
            LocalDateTime prevStart = startDate.minus(daysBetween, ChronoUnit.DAYS);
            double previousTotal = collectedWaste.stream()
                    .filter(w -> w.getUpdatedAt() != null && w.getUpdatedAt().isAfter(prevStart) && w.getUpdatedAt().isBefore(startDate))
                    .mapToDouble(Waste::getQuantity).sum();
            double changePercentage = previousTotal > 0 ? ((totalWaste - previousTotal) / previousTotal) * 100 : 0;

            Map<String, Object> analytics = new HashMap<>();
            analytics.put("totalWaste", Math.round(totalWaste * 100.0) / 100.0);
            analytics.put("entryCount", filtered.size());
            analytics.put("wasteByCategory", wasteByCategory);
            analytics.put("wasteByStatus", wasteByStatus);
            analytics.put("changePercentage", Math.round(changePercentage * 100.0) / 100.0);
            analytics.put("timeRange", timeRange);
            analytics.put("startDate", startDate);
            analytics.put("endDate", endDate);
            analytics.put("co2Saved", Math.round(calculateCO2Saved(filtered) * 100.0) / 100.0);

            return ResponseEntity.ok(analytics);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to get collector analytics: " + e.getMessage()));
        }
    }

    @GetMapping("/analytics/collector-trends/{collectorId}")
    public ResponseEntity<Map<String, Object>> getCollectorTrends(@PathVariable Long collectorId,
                                                                   @RequestParam(defaultValue = "month") String timeRange) {
        try {
            List<Waste> collectedWaste = wasteRepository.findByCollectedById(collectorId);

            LocalDateTime endDate = LocalDateTime.now();
            LocalDateTime startDate;
            int periods;
            String periodLabel;

            switch (timeRange.toLowerCase()) {
                case "week":
                    startDate = endDate.minus(7, ChronoUnit.DAYS);
                    periods = 7; periodLabel = "Day"; break;
                case "year":
                    startDate = endDate.minus(12, ChronoUnit.MONTHS);
                    periods = 12; periodLabel = "Month"; break;
                default:
                    YearMonth currentMonth2 = YearMonth.now();
                    startDate = currentMonth2.atDay(1).atStartOfDay();
                    int daysInMonth2 = currentMonth2.lengthOfMonth();
                    periods = (int) Math.ceil(daysInMonth2 / 7.0);
                    periodLabel = "Week";
            }

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
                    YearMonth cm2 = YearMonth.now();
                    int dayStart = i * 7 + 1;
                    int dayEnd = Math.min(dayStart + 7, cm2.lengthOfMonth() + 1);
                    periodStart = cm2.atDay(dayStart).atStartOfDay();
                    periodEnd = cm2.atDay(Math.min(dayEnd - 1, cm2.lengthOfMonth())).atTime(23, 59, 59);
                    label = "Week " + (i + 1);
                }

                final LocalDateTime pStart = periodStart;
                final LocalDateTime pEnd = periodEnd;
                double periodWaste = collectedWaste.stream()
                        .filter(w -> w.getUpdatedAt() != null &&
                                w.getUpdatedAt().isAfter(pStart) && w.getUpdatedAt().isBefore(pEnd))
                        .mapToDouble(Waste::getQuantity).sum();

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
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to get collector trends: " + e.getMessage()));
        }
    }

    // ── Collector dashboard stats ──

    @GetMapping("/analytics/collector-dashboard/{collectorId}")
    public ResponseEntity<Map<String, Object>> getCollectorDashboardStats(@PathVariable Long collectorId) {
        try {
            List<Waste> allCollected = wasteRepository.findByCollectedById(collectorId);
            List<Waste> pendingAll = wasteRepository.findByStatus("PENDING");
            List<Waste> inProgressAll = wasteRepository.findByStatus("IN_PROGRESS");

            LocalDate today = LocalDate.now();
            LocalDateTime todayStart = today.atStartOfDay();
            LocalDateTime weekStart = today.minusDays(today.getDayOfWeek().getValue() - 1L).atStartOfDay();
            LocalDateTime monthStart = YearMonth.now().atDay(1).atStartOfDay();

            // Collected items only
            List<Waste> collected = allCollected.stream()
                    .filter(w -> "COLLECTED".equals(w.getStatus()))
                    .collect(Collectors.toList());

            double todayKg = collected.stream()
                    .filter(w -> w.getUpdatedAt() != null && w.getUpdatedAt().isAfter(todayStart))
                    .mapToDouble(Waste::getQuantity).sum();
            long todayPickups = collected.stream()
                    .filter(w -> w.getUpdatedAt() != null && w.getUpdatedAt().isAfter(todayStart))
                    .count();
            double weeklyKg = collected.stream()
                    .filter(w -> w.getUpdatedAt() != null && w.getUpdatedAt().isAfter(weekStart))
                    .mapToDouble(Waste::getQuantity).sum();
            double monthlyKg = collected.stream()
                    .filter(w -> w.getUpdatedAt() != null && w.getUpdatedAt().isAfter(monthStart))
                    .mapToDouble(Waste::getQuantity).sum();
            double totalKg = collected.stream().mapToDouble(Waste::getQuantity).sum();

            long urgentCount = pendingAll.stream()
                    .filter(w -> ChronoUnit.DAYS.between(w.getCreatedAt().toLocalDate(), today) > 3)
                    .count();

            double co2Saved = calculateCO2Saved(collected);

            Map<String, Object> stats = new HashMap<>();
            stats.put("todayKg", Math.round(todayKg * 100.0) / 100.0);
            stats.put("todayPickups", todayPickups);
            stats.put("weeklyKg", Math.round(weeklyKg * 100.0) / 100.0);
            stats.put("monthlyKg", Math.round(monthlyKg * 100.0) / 100.0);
            stats.put("totalKg", Math.round(totalKg * 100.0) / 100.0);
            stats.put("totalPickups", collected.size());
            stats.put("pendingCount", pendingAll.size());
            stats.put("inProgressCount", inProgressAll.size());
            stats.put("urgentCount", urgentCount);
            stats.put("co2Saved", Math.round(co2Saved * 100.0) / 100.0);

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to get dashboard stats: " + e.getMessage()));
        }
    }

    // ── Collector pickup history ──

    @GetMapping("/collector-history/{collectorId}")
    public ResponseEntity<?> getCollectorHistory(@PathVariable Long collectorId) {
        try {
            List<Waste> history = wasteRepository.findByCollectedByIdAndStatus(collectorId, "COLLECTED");
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to get collector history: " + e.getMessage()));
        }
    }

    // ── CO2 helper ──

    private double calculateCO2Saved(List<Waste> wasteList) {
        return wasteList.stream().mapToDouble(w -> {
            switch (w.getType()) {
                case "FOOD":    return w.getQuantity() * 2.5;
                case "E-WASTE": return w.getQuantity() * 1.8;
                case "PLASTIC": return w.getQuantity() * 1.2;
                case "PAPER":   return w.getQuantity() * 1.0;
                case "ORGANIC": return w.getQuantity() * 2.0;
                default:        return w.getQuantity() * 1.0;
            }
        }).sum();
    }

    // ── Algorithm endpoints (priority, scheduling, facility matching) ──

    @GetMapping("/priority")
    public Map<String, Object> calculatePriority(
            @RequestParam String type,
            @RequestParam double quantity,
            @RequestParam int days,
            @RequestParam double distance) {
        double score = wastePriorityService.calculatePriority(type, quantity, days, distance);
        Map<String, Object> response = new HashMap<>();
        response.put("wasteType", type);
        response.put("quantity", quantity);
        response.put("daysSinceGenerated", days);
        response.put("distanceKm", distance);
        response.put("priorityScore", score);
        String level = score > 50 ? "HIGH" : score > 25 ? "MEDIUM" : "LOW";
        response.put("priorityLevel", level);
        return response;
    }

    @GetMapping("/pickup-schedule")
    public Map<String, Object> schedulePickup(
            @RequestParam String type,
            @RequestParam int quantity,
            @RequestParam int days,
            @RequestParam int availableSlots) {
        String schedule = pickupSchedulingService.schedulePickup(type, quantity, days, availableSlots);
        Map<String, Object> response = new HashMap<>();
        response.put("wasteType", type);
        response.put("quantity", quantity);
        response.put("daysSinceGenerated", days);
        response.put("availablePickupSlots", availableSlots);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");
        response.put("currentDateTime", LocalDateTime.now().format(formatter));
        response.put("pickupSchedule", schedule);
        return response;
    }

    @GetMapping("/nearest-facility")
    public Facility getNearestFacility(
            @RequestParam String type,
            @RequestParam double lat,
            @RequestParam double lng) {
        List<Facility> facilities = facilityRepository.findAll();
        if (facilities.isEmpty()) {
            facilities = List.of(
                new Facility("NGO A", "FOOD", 12.9716, 77.5946),
                new Facility("Recycler B", "EWASTE", 12.9352, 77.6245),
                new Facility("Compost Site", "COMPOST", 12.9600, 77.5900)
            );
        }
        return facilityMatchingService.findNearestFacility(type, lat, lng, facilities);
    }

    // ── AI Waste Classification ──

    @PostMapping("/classify")
    public ResponseEntity<?> classifyWaste(@RequestBody Map<String, Object> body) {
        try {
            Long userId = Long.valueOf(body.get("userId").toString());
            String imageBase64 = (String) body.get("imageBase64");
            String mimeType = "image/jpeg";
            String base64Data = imageBase64;
            if (imageBase64.contains(",")) {
                String header = imageBase64.split(",")[0];
                base64Data = imageBase64.split(",")[1];
                if (header.contains("image/png")) mimeType = "image/png";
                else if (header.contains("image/webp")) mimeType = "image/webp";
                else if (header.contains("image/gif")) mimeType = "image/gif";
            }

            String prompt = "You are a waste management AI for EcoTrack app. A user has photographed an item they want to dispose of. " +
                    "Analyze this image and determine if it shows a physical waste item that can be recycled or disposed of. " +
                    "If the image shows a screenshot, document, text, or digital content, return confidence_score of 0. " +
                    "If it shows a real physical electronic device or e-waste, set category to E-waste. " +
                    "If it shows real physical food, organic waste, or food packaging, set category to Food. " +
                    "If it shows something unrelated to waste, set confidence_score below 30. " +
                    "Return ONLY a valid JSON object with these exact fields: category, item_name, condition, disposal_method, estimated_weight, confidence_score, notes";

            // Build Groq API request (OpenAI-compatible format with vision)
            Gson gson = new Gson();

            JsonObject imageUrlObj = new JsonObject();
            imageUrlObj.addProperty("url", "data:" + mimeType + ";base64," + base64Data);

            JsonObject imagePart = new JsonObject();
            imagePart.addProperty("type", "image_url");
            imagePart.add("image_url", imageUrlObj);

            JsonObject textPart = new JsonObject();
            textPart.addProperty("type", "text");
            textPart.addProperty("text", prompt);

            com.google.gson.JsonArray contentArr = new com.google.gson.JsonArray();
            contentArr.add(imagePart);
            contentArr.add(textPart);

            JsonObject userMessage = new JsonObject();
            userMessage.addProperty("role", "user");
            userMessage.add("content", contentArr);

            com.google.gson.JsonArray messages = new com.google.gson.JsonArray();
            messages.add(userMessage);

            JsonObject requestBody = new JsonObject();
            requestBody.addProperty("model", "meta-llama/llama-4-scout-17b-16e-instruct");
            requestBody.add("messages", messages);
            requestBody.addProperty("max_tokens", 512);
            requestBody.addProperty("temperature", 0.2);

            HttpClient httpClient = HttpClient.newHttpClient();
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + groqApiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(gson.toJson(requestBody)))
                    .build();

            HttpResponse<String> httpResponse = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            System.out.println("Groq API HTTP Status: " + httpResponse.statusCode());
            System.out.println("Groq API Response Body: " + httpResponse.body());

            JsonObject groqResponse = null;
            try {
                groqResponse = gson.fromJson(httpResponse.body(), JsonObject.class);
            } catch (Exception e) {
                System.err.println("Failed to parse Groq response as JSON: " + e.getMessage());
                return ResponseEntity.status(500).body(Map.of("error", "Groq API returned invalid response", "debug", httpResponse.body()));
            }

            // Handle HTTP status errors from Groq
            if (httpResponse.statusCode() != 200) {
                System.err.println("Groq API error status: " + httpResponse.statusCode());
                if (groqResponse.has("error")) {
                    JsonObject err = groqResponse.getAsJsonObject("error");
                    String errorMsg = err.has("message") ? err.get("message").getAsString() : "Unknown error";
                    System.err.println("Groq error: " + errorMsg);
                    
                    if (httpResponse.statusCode() == 429 || errorMsg.contains("rate_limit")) {
                        return ResponseEntity.status(429).body(Map.of("error", "AI is busy right now. Please wait a moment and try again."));
                    }
                    return ResponseEntity.status(500).body(Map.of("error", "Groq API error: " + errorMsg));
                }
                return ResponseEntity.status(500).body(Map.of("error", "Groq API returned status " + httpResponse.statusCode()));
            }

            // Handle Groq API errors
            if (!groqResponse.has("choices") || groqResponse.getAsJsonArray("choices").isEmpty()) {
                System.err.println("Groq API response: " + httpResponse.body());
                if (groqResponse.has("error")) {
                    JsonObject err = groqResponse.getAsJsonObject("error");
                    String errType = err.has("type") ? err.get("type").getAsString() : "";
                    if ("rate_limit_exceeded".equals(errType)) {
                        return ResponseEntity.status(429).body(Map.of("error", "AI is busy right now. Please wait a moment and try again."));
                    }
                    String errorMsg = err.has("message") ? err.get("message").getAsString() : "Unknown error";
                    return ResponseEntity.status(500).body(Map.of("error", "Groq API error: " + errorMsg));
                }
                return ResponseEntity.status(500).body(Map.of("error", "Groq API returned no choices in response"));
            }

            String text = groqResponse
                    .getAsJsonArray("choices")
                    .get(0).getAsJsonObject()
                    .getAsJsonObject("message")
                    .get("content").getAsString();

            if (text == null || text.isEmpty()) {
                System.err.println("Groq returned empty content");
                return ResponseEntity.status(500).body(Map.of("error", "AI returned empty response"));
            }

            text = text.trim();
            System.out.println("Raw AI response: " + text);
            
            if (text.startsWith("```")) {
                text = text.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();
            }

            // Try to extract JSON object from response if it's wrapped in other text
            String jsonText = text;
            if (!text.startsWith("{")) {
                int jsonStart = text.indexOf("{");
                int jsonEnd = text.lastIndexOf("}");
                if (jsonStart != -1 && jsonEnd != -1 && jsonEnd > jsonStart) {
                    jsonText = text.substring(jsonStart, jsonEnd + 1);
                    System.out.println("Extracted JSON from response: " + jsonText);
                }
            }

            JsonObject aiResult = null;
            try {
                aiResult = gson.fromJson(jsonText, JsonObject.class);
            } catch (Exception e) {
                System.err.println("Failed to parse AI response as JSON");
                System.err.println("Original response text: " + text);
                System.err.println("Error: " + e.getMessage());
                e.printStackTrace();
                return ResponseEntity.status(500).body(Map.of("error", "AI returned invalid JSON: " + e.getMessage(), "debug", text));
            }

            if (aiResult == null) {
                System.err.println("AI response parsed to null");
                System.err.println("Response text: " + text);
                return ResponseEntity.status(500).body(Map.of("error", "AI classification unavailable: null response", "debug", text));
            }

            System.out.println("Successfully parsed AI result: " + aiResult.toString());

            WasteClassification classification = new WasteClassification();
            classification.setUserId(userId);
            classification.setPredictedCategory(aiResult.has("category") ? aiResult.get("category").getAsString() : "Unknown");
            classification.setItemName(aiResult.has("item_name") ? aiResult.get("item_name").getAsString() : "Unknown");
            classification.setPredictedCondition(aiResult.has("condition") ? aiResult.get("condition").getAsString() : "Unknown");
            classification.setPredictedDisposal(aiResult.has("disposal_method") ? aiResult.get("disposal_method").getAsString() : "Unknown");
            
            // Safe extraction of estimated_weight as double
            double estimatedWeight = 0.0;
            if (aiResult.has("estimated_weight")) {
                try {
                    estimatedWeight = aiResult.get("estimated_weight").getAsDouble();
                } catch (Exception e) {
                    System.err.println("Failed to parse estimated_weight: " + e.getMessage());
                }
            }
            classification.setEstimatedWeight(estimatedWeight);
            
            // Safe extraction of confidence_score as int (can be int or double in JSON)
            int confidenceScore = 0;
            if (aiResult.has("confidence_score")) {
                try {
                    confidenceScore = aiResult.get("confidence_score").getAsInt();
                } catch (Exception e) {
                    try {
                        confidenceScore = (int) aiResult.get("confidence_score").getAsDouble();
                    } catch (Exception e2) {
                        System.err.println("Failed to parse confidence_score: " + e2.getMessage());
                    }
                }
            }
            classification.setConfidenceScore(confidenceScore);
            
            classification.setNotes(aiResult.has("notes") ? aiResult.get("notes").getAsString() : "");
            classification.setWasAccepted(false);
            classification.setCreatedAt(LocalDateTime.now());

            WasteClassification saved = wasteClassificationRepository.save(classification);

            Map<String, Object> result = new HashMap<>();
            result.put("id", saved.getId());
            result.put("predictedCategory", saved.getPredictedCategory());
            result.put("itemName", saved.getItemName());
            result.put("predictedCondition", saved.getPredictedCondition());
            result.put("predictedDisposal", saved.getPredictedDisposal());
            result.put("estimatedWeight", saved.getEstimatedWeight());
            result.put("confidenceScore", saved.getConfidenceScore());
            result.put("notes", saved.getNotes());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Classification failed: " + e.getMessage()));
        }
    }

    @PatchMapping("/classifications/{id}/accepted")
    public ResponseEntity<?> updateClassificationAccepted(@PathVariable Long id,
                                                          @RequestBody Map<String, Object> body) {
        return wasteClassificationRepository.findById(id).map(c -> {
            c.setWasAccepted(Boolean.parseBoolean(body.get("wasAccepted").toString()));
            wasteClassificationRepository.save(c);
            return ResponseEntity.<Object>ok(Map.of("success", true));
        }).orElse(ResponseEntity.notFound().build());
    }
}
