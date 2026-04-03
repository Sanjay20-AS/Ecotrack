package com.ecotrack.backend.controller;

import com.ecotrack.backend.model.CarbonFootprintSummary;
import com.ecotrack.backend.service.CarbonFootprintService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/carbon")
public class CarbonFootprintController {

    @Autowired
    private CarbonFootprintService carbonFootprintService;

    @GetMapping("/{userId}")
    public ResponseEntity<CarbonFootprintSummary> getCurrentMonth(@PathVariable Long userId) {
        CarbonFootprintSummary s = carbonFootprintService.getCurrentMonthCarbon(userId);
        if (s == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(s);
    }

    @GetMapping("/{userId}/history")
    public ResponseEntity<List<CarbonFootprintSummary>> getHistory(@PathVariable Long userId) {
        List<CarbonFootprintSummary> list = carbonFootprintService.getUserCarbonHistory(userId);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<Map<String, Object>>> getLeaderboard() {
        return ResponseEntity.ok(carbonFootprintService.getUserCarbonLeaderboard());
    }

    @PostMapping("/{userId}/recalculate")
    public ResponseEntity<?> recalculate(@PathVariable Long userId) {
        carbonFootprintService.updateUserCarbonSummary(userId);
        // Return updated history so frontend can refresh chart immediately
        List<CarbonFootprintSummary> list = carbonFootprintService.getUserCarbonHistory(userId);
        return ResponseEntity.ok(list);
    }
}
