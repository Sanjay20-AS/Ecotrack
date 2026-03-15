package com.ecotrack.backend.controller;

import com.ecotrack.backend.model.Badge;
import com.ecotrack.backend.model.Redemption;
import com.ecotrack.backend.model.UserBadge;
import com.ecotrack.backend.model.Waste;
import com.ecotrack.backend.repository.BadgeRepository;
import com.ecotrack.backend.repository.RedemptionRepository;
import com.ecotrack.backend.repository.UserBadgeRepository;
import com.ecotrack.backend.repository.WasteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rewards")
public class RewardsController {

    private static final int POINTS_PER_KG = 10;
    private static final int POINTS_PER_ENTRY = 5;
    private static final double CO2_RATE = 2.5;

    @Autowired private WasteRepository wasteRepository;
    @Autowired private BadgeRepository badgeRepository;
    @Autowired private UserBadgeRepository userBadgeRepository;
    @Autowired private RedemptionRepository redemptionRepository;

    @GetMapping("/points/{userId}")
    public ResponseEntity<Map<String, Object>> getPoints(@PathVariable Long userId) {
        List<Waste> entries = wasteRepository.findByUserId(userId);

        double totalKg = entries.stream().mapToDouble(Waste::getQuantity).sum();
        double co2Saved = entries.stream()
                .filter(w -> "COLLECTED".equals(w.getStatus()))
                .mapToDouble(w -> w.getQuantity() * CO2_RATE).sum();
        int entryCount = entries.size();
        int totalPoints = (int) (totalKg * POINTS_PER_KG) + (entryCount * POINTS_PER_ENTRY);

        // Subtract redeemed points
        int spentPoints = redemptionRepository.findByUserIdOrderByRedeemedAtDesc(userId)
                .stream().mapToInt(Redemption::getPointsCost).sum();

        Map<String, Object> result = new HashMap<>();
        result.put("totalPoints", totalPoints);
        result.put("availablePoints", totalPoints - spentPoints);
        result.put("spentPoints", spentPoints);
        result.put("totalKg", Math.round(totalKg * 10.0) / 10.0);
        result.put("entryCount", entryCount);
        result.put("co2Saved", Math.round(co2Saved * 10.0) / 10.0);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/badges")
    public List<Badge> getAllBadges() {
        return badgeRepository.findAll();
    }

    @GetMapping("/user-badges/{userId}")
    public List<UserBadge> getUserBadges(@PathVariable Long userId) {
        return userBadgeRepository.findByUserId(userId);
    }

    @PostMapping("/check-badges/{userId}")
    public ResponseEntity<List<UserBadge>> checkAndAwardBadges(@PathVariable Long userId) {
        List<Waste> entries = wasteRepository.findByUserId(userId);
        double totalKg = entries.stream().mapToDouble(Waste::getQuantity).sum();
        double co2Saved = entries.stream()
                .filter(w -> "COLLECTED".equals(w.getStatus()))
                .mapToDouble(w -> w.getQuantity() * CO2_RATE).sum();
        int entryCount = entries.size();

        List<Badge> allBadges = badgeRepository.findAll();
        for (Badge badge : allBadges) {
            if (!userBadgeRepository.existsByUserIdAndBadgeId(userId, badge.getId())) {
                double metricValue = switch (badge.getMetric()) {
                    case "ENTRIES" -> entryCount;
                    case "TOTAL_KG" -> totalKg;
                    case "CO2_SAVED" -> co2Saved;
                    default -> 0;
                };
                if (metricValue >= badge.getThreshold()) {
                    userBadgeRepository.save(new UserBadge(userId, badge));
                }
            }
        }
        return ResponseEntity.ok(userBadgeRepository.findByUserId(userId));
    }

    @PostMapping("/redeem")
    public ResponseEntity<?> redeem(@RequestBody Map<String, Object> body) {
        try {
            Long userId = Long.valueOf(body.get("userId").toString());
            String rewardId = body.get("rewardId").toString();
            String rewardName = body.get("rewardName").toString();
            int pointsCost = Integer.parseInt(body.get("pointsCost").toString());

            // Verify user has enough points
            List<Waste> entries = wasteRepository.findByUserId(userId);
            double totalKg = entries.stream().mapToDouble(Waste::getQuantity).sum();
            int entryCount = entries.size();
            int totalPoints = (int) (totalKg * POINTS_PER_KG) + (entryCount * POINTS_PER_ENTRY);
            int spentPoints = redemptionRepository.findByUserIdOrderByRedeemedAtDesc(userId)
                    .stream().mapToInt(Redemption::getPointsCost).sum();
            int availablePoints = totalPoints - spentPoints;

            if (availablePoints < pointsCost) {
                return ResponseEntity.badRequest().body(Map.of("error", "Insufficient points"));
            }

            Redemption redemption = new Redemption(userId, rewardId, rewardName, pointsCost);
            return ResponseEntity.ok(redemptionRepository.save(redemption));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Redemption failed: " + e.getMessage()));
        }
    }

    @GetMapping("/redemptions/{userId}")
    public List<Redemption> getRedemptions(@PathVariable Long userId) {
        return redemptionRepository.findByUserIdOrderByRedeemedAtDesc(userId);
    }
}
