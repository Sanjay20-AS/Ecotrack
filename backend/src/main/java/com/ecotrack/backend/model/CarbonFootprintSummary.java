package com.ecotrack.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "carbon_footprint_summary")
public class CarbonFootprintSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "month_value", nullable = false)
    private int month;

    @Column(nullable = false)
    private int year;

    @Column(name = "total_carbon_saved")
    private double totalCarbonSaved;

    @Column(name = "total_carbon_generated")
    private double totalCarbonGenerated;

    @Column(name = "net_carbon")
    private double netCarbon;

    @Column(name = "carbon_score")
    private int carbonScore;

    @Column(name = "trees_equivalent")
    private double treesEquivalent;

    @Column(name = "car_km_equivalent")
    private double carKmEquivalent;

    @Column(name = "electricity_hours_equivalent")
    private double electricityHoursEquivalent;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public CarbonFootprintSummary() {}

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public int getMonth() { return month; }
    public void setMonth(int month) { this.month = month; }

    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }

    public double getTotalCarbonSaved() { return totalCarbonSaved; }
    public void setTotalCarbonSaved(double totalCarbonSaved) { this.totalCarbonSaved = totalCarbonSaved; }

    public double getTotalCarbonGenerated() { return totalCarbonGenerated; }
    public void setTotalCarbonGenerated(double totalCarbonGenerated) { this.totalCarbonGenerated = totalCarbonGenerated; }

    public double getNetCarbon() { return netCarbon; }
    public void setNetCarbon(double netCarbon) { this.netCarbon = netCarbon; }

    public int getCarbonScore() { return carbonScore; }
    public void setCarbonScore(int carbonScore) { this.carbonScore = carbonScore; }

    public double getTreesEquivalent() { return treesEquivalent; }
    public void setTreesEquivalent(double treesEquivalent) { this.treesEquivalent = treesEquivalent; }

    public double getCarKmEquivalent() { return carKmEquivalent; }
    public void setCarKmEquivalent(double carKmEquivalent) { this.carKmEquivalent = carKmEquivalent; }

    public double getElectricityHoursEquivalent() { return electricityHoursEquivalent; }
    public void setElectricityHoursEquivalent(double electricityHoursEquivalent) { this.electricityHoursEquivalent = electricityHoursEquivalent; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
