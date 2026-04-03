package com.ecotrack.backend.service;

import com.ecotrack.backend.model.CarbonFootprintSummary;
import com.ecotrack.backend.model.User;
import com.ecotrack.backend.model.Waste;
import com.ecotrack.backend.repository.CarbonFootprintRepository;
import com.ecotrack.backend.repository.UserRepository;
import com.ecotrack.backend.repository.WasteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CarbonFootprintService {

    // Carbon factors
    private static final double FOOD_GENERATION_FACTOR = 2.5;
    private static final double EWASTE_GENERATION_FACTOR = 3.0;
    private static final double FOOD_SAVING_FACTOR = 2.5;
    private static final double EWASTE_SAVING_FACTOR = 1.8;
    private static final double TREE_ABSORPTION_PER_YEAR = 21.0;
    private static final double CAR_KM_EMISSION = 0.12;
    private static final double ELECTRICITY_KG_PER_HOUR = 0.5;
    private static final double POINTS_THRESHOLD_HIGH = 50.0;
    private static final double POINTS_THRESHOLD_MEDIUM = 25.0;

    @Autowired
    private WasteRepository wasteRepository;

    @Autowired
    private CarbonFootprintRepository carbonFootprintRepository;

    @Autowired
    private UserRepository userRepository;

    public Waste calculateCarbonForWaste(Waste waste) {
        if (waste == null) return null;

        double generated = 0.0;
        double saved = 0.0;
        String type = waste.getType() != null ? waste.getType().toUpperCase() : "OTHER";
        double qty = waste.getQuantity();

        switch (type) {
            case "FOOD":
                generated = qty * FOOD_GENERATION_FACTOR;
                saved = qty * FOOD_SAVING_FACTOR;
                break;
            case "E-WASTE":
                generated = qty * EWASTE_GENERATION_FACTOR;
                saved = qty * EWASTE_SAVING_FACTOR;
                break;
            default:
                // For other types, assume small generation and no saving by default
                generated = qty * 1.0;
                saved = 0.0;
        }

        // Only count carbonSaved if collected
        if (!"COLLECTED".equals(waste.getStatus())) {
            saved = 0.0;
        }

        // Calculate score
        int score = (int) Math.round(saved * 10.0);

        // Speed bonus
        if (waste.getClaimedAt() != null && waste.getCreatedAt() != null) {
            long hours = java.time.Duration.between(waste.getCreatedAt(), waste.getClaimedAt()).toHours();
            if (hours <= 24) score += 50;
            else if (hours <= 48) score += 30;
            else if (hours <= 72) score += 10;
        }

        waste.setCarbonGenerated(Math.round(generated * 100.0) / 100.0);
        waste.setCarbonSaved(Math.round(saved * 100.0) / 100.0);
        waste.setCarbonScore(score);

        wasteRepository.save(waste);
        return waste;
    }

    public void updateUserCarbonSummary(Long userId) {
        if (userId == null) return;
        List<Waste> wastes = wasteRepository.findByUserId(userId);
        if (wastes == null) wastes = Collections.emptyList();

        // Group COLLECTED wastes by YearMonth based on claimedAt (when they were collected)
        Map<YearMonth, List<Waste>> grouped = wastes.stream()
            .filter(w -> "COLLECTED".equals(w.getStatus()) && w.getClaimedAt() != null)
            .collect(Collectors.groupingBy(w -> YearMonth.from(w.getClaimedAt())));

        for (Map.Entry<YearMonth, List<Waste>> e : grouped.entrySet()) {
            YearMonth ym = e.getKey();
            int month = ym.getMonthValue();
            int year = ym.getYear();

            // Sum carbonSaved for collected entries (null-safe)
            double totalSaved = e.getValue().stream()
                    .mapToDouble(w -> w.getCarbonSaved() == null ? 0.0 : w.getCarbonSaved())
                    .sum();

            // Sum carbonGenerated for those same collected entries (null-safe)
            double totalGenerated = e.getValue().stream()
                    .mapToDouble(w -> w.getCarbonGenerated() == null ? 0.0 : w.getCarbonGenerated())
                    .sum();

            double net = totalSaved - totalGenerated;
            int totalScore = e.getValue().stream().mapToInt(w -> w.getCarbonScore() == null ? 0 : w.getCarbonScore()).sum();

            double treesEq = totalSaved / TREE_ABSORPTION_PER_YEAR;
            double carKmEq = totalSaved / CAR_KM_EMISSION;
            double elecHoursEq = totalSaved / ELECTRICITY_KG_PER_HOUR;

            CarbonFootprintSummary summary = carbonFootprintRepository.findByUserIdAndMonthAndYear(userId, month, year);
            if (summary == null) summary = new CarbonFootprintSummary();

            summary.setUserId(userId);
            summary.setMonth(month);
            summary.setYear(year);
            summary.setTotalCarbonSaved(Math.round(totalSaved * 100.0) / 100.0);
            summary.setTotalCarbonGenerated(Math.round(totalGenerated * 100.0) / 100.0);
            summary.setNetCarbon(Math.round(net * 100.0) / 100.0);
            summary.setCarbonScore(totalScore);
            summary.setTreesEquivalent(Math.round(treesEq * 100.0) / 100.0);
            summary.setCarKmEquivalent(Math.round(carKmEq * 100.0) / 100.0);
            summary.setElectricityHoursEquivalent(Math.round(elecHoursEq * 100.0) / 100.0);
            summary.setUpdatedAt(LocalDateTime.now());

            carbonFootprintRepository.save(summary);
        }
    }

    public List<CarbonFootprintSummary> getUserCarbonHistory(Long userId) {
        List<CarbonFootprintSummary> list = carbonFootprintRepository.findByUserId(userId);
        if (list == null) return Collections.emptyList();
        list.sort(Comparator.comparing(CarbonFootprintSummary::getYear).reversed()
                .thenComparing(CarbonFootprintSummary::getMonth).reversed());
        return list;
    }

    public List<Map<String, Object>> getUserCarbonLeaderboard() {
        // Aggregate total carbonSaved per user across all waste entries
        List<Waste> all = wasteRepository.findAll();
        Map<Long, Double> byUser = new HashMap<>();
        for (Waste w : all) {
            if (w.getUser() == null) continue;
            double saved = w.getCarbonSaved() == null ? 0.0 : w.getCarbonSaved();
            byUser.put(w.getUser().getId(), byUser.getOrDefault(w.getUser().getId(), 0.0) + saved);
        }

        // Convert to list of maps with userId, name, totalCarbonSaved, treesEquivalent
        List<Map<String, Object>> results = new ArrayList<>();
        for (Map.Entry<Long, Double> entry : byUser.entrySet()) {
            Long uid = entry.getKey();
            Double totalSaved = Math.round(entry.getValue() * 100.0) / 100.0;
            Optional<User> uopt = userRepository.findById(uid);
            String name = uopt.map(User::getName).orElse("Unknown");
            double trees = Math.round((totalSaved / TREE_ABSORPTION_PER_YEAR) * 100.0) / 100.0;
            Map<String, Object> row = new HashMap<>();
            row.put("userId", uid);
            row.put("name", name);
            row.put("totalCarbonSaved", totalSaved);
            row.put("treesEquivalent", trees);
            results.add(row);
        }

        results.sort((a, b) -> Double.compare((Double) b.get("totalCarbonSaved"), (Double) a.get("totalCarbonSaved")));
        return results.stream().limit(10).collect(Collectors.toList());
    }

    public CarbonFootprintSummary getCurrentMonthCarbon(Long userId) {
        YearMonth now = YearMonth.now();
        CarbonFootprintSummary summary = carbonFootprintRepository.findByUserIdAndMonthAndYear(userId, now.getMonthValue(), now.getYear());
        if (summary != null) return summary;
        // compute fresh for current month
        updateUserCarbonSummary(userId);
        return carbonFootprintRepository.findByUserIdAndMonthAndYear(userId, now.getMonthValue(), now.getYear());
    }
}
