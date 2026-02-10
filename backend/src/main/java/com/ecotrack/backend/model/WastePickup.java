package com.ecotrack.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "waste_pickups")
public class WastePickup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "waste_id", nullable = false)
    private Waste waste;

    @ManyToOne
    @JoinColumn(name = "facility_id", nullable = false)
    private Facility facility;

    @Column(nullable = false)
    private String pickupSchedule; // IMMEDIATE, PRIORITY, STANDARD, BULK

    @Column(name = "scheduled_date")
    private LocalDateTime scheduledDate;

    @Column(name = "completed_date")
    private LocalDateTime completedDate;

    @Column
    private String status; // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public WastePickup() {}

    public WastePickup(Waste waste, Facility facility, String pickupSchedule) {
        this.waste = waste;
        this.facility = facility;
        this.pickupSchedule = pickupSchedule;
        this.status = "SCHEDULED";
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Waste getWaste() {
        return waste;
    }

    public void setWaste(Waste waste) {
        this.waste = waste;
    }

    public Facility getFacility() {
        return facility;
    }

    public void setFacility(Facility facility) {
        this.facility = facility;
    }

    public String getPickupSchedule() {
        return pickupSchedule;
    }

    public void setPickupSchedule(String pickupSchedule) {
        this.pickupSchedule = pickupSchedule;
    }

    public LocalDateTime getScheduledDate() {
        return scheduledDate;
    }

    public void setScheduledDate(LocalDateTime scheduledDate) {
        this.scheduledDate = scheduledDate;
    }

    public LocalDateTime getCompletedDate() {
        return completedDate;
    }

    public void setCompletedDate(LocalDateTime completedDate) {
        this.completedDate = completedDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
