package com.ecotrack.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "waste")
public class Waste {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String type; // FOOD, E-WASTE, PLASTIC, PAPER, ORGANIC, OTHER

    @Column(nullable = false)
    private double quantity; // in kg

    @Column(nullable = false)
    private String description;

    @Column(name = "location_latitude")
    private double locationLatitude;

    @Column(name = "location_longitude")
    private double locationLongitude;

    @Column(name = "location_address")
    private String locationAddress;

    @Column(name = "image_url")
    private String imageUrl;

    @Column
    private String status; // PENDING, IN_PROGRESS, COLLECTED

    @ManyToOne
    @JoinColumn(name = "collected_by_id")
    private User collectedBy;

    @Column(name = "collector_notes")
    private String collectorNotes;

    @Column(name = "claimed_at")
    private LocalDateTime claimedAt;

    @Column(name = "collection_photo_url")
    private String collectionPhotoUrl;

    @Column(name = "collector_latitude")
    private Double collectorLatitude;

    @Column(name = "collector_longitude")
    private Double collectorLongitude;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "carbon_generated")
    private Double carbonGenerated = 0.0;

    @Column(name = "carbon_saved")
    private Double carbonSaved = 0.0;

    @Column(name = "carbon_score")
    private Integer carbonScore = 0;

    public Waste() {}

    public Waste(User user, String type, double quantity, String description) {
        this.user = user;
        this.type = type;
        this.quantity = quantity;
        this.description = description;
        this.status = "PENDING";
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public double getQuantity() {
        return quantity;
    }

    public void setQuantity(double quantity) {
        this.quantity = quantity;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public double getLocationLatitude() {
        return locationLatitude;
    }

    public void setLocationLatitude(double locationLatitude) {
        this.locationLatitude = locationLatitude;
    }

    public double getLocationLongitude() {
        return locationLongitude;
    }

    public void setLocationLongitude(double locationLongitude) {
        this.locationLongitude = locationLongitude;
    }

    public String getLocationAddress() {
        return locationAddress;
    }

    public void setLocationAddress(String locationAddress) {
        this.locationAddress = locationAddress;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
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

    public Double getCarbonGenerated() {
        return carbonGenerated;
    }

    public void setCarbonGenerated(Double carbonGenerated) {
        this.carbonGenerated = carbonGenerated;
    }

    public Double getCarbonSaved() {
        return carbonSaved;
    }

    public void setCarbonSaved(Double carbonSaved) {
        this.carbonSaved = carbonSaved;
    }

    public Integer getCarbonScore() {
        return carbonScore;
    }

    public void setCarbonScore(Integer carbonScore) {
        this.carbonScore = carbonScore;
    }

    public User getCollectedBy() {
        return collectedBy;
    }

    public void setCollectedBy(User collectedBy) {
        this.collectedBy = collectedBy;
    }

    public String getCollectorNotes() {
        return collectorNotes;
    }

    public void setCollectorNotes(String collectorNotes) {
        this.collectorNotes = collectorNotes;
    }

    public LocalDateTime getClaimedAt() {
        return claimedAt;
    }

    public void setClaimedAt(LocalDateTime claimedAt) {
        this.claimedAt = claimedAt;
    }

    public String getCollectionPhotoUrl() {
        return collectionPhotoUrl;
    }

    public void setCollectionPhotoUrl(String collectionPhotoUrl) {
        this.collectionPhotoUrl = collectionPhotoUrl;
    }

    public Double getCollectorLatitude() {
        return collectorLatitude;
    }

    public void setCollectorLatitude(Double collectorLatitude) {
        this.collectorLatitude = collectorLatitude;
    }

    public Double getCollectorLongitude() {
        return collectorLongitude;
    }

    public void setCollectorLongitude(Double collectorLongitude) {
        this.collectorLongitude = collectorLongitude;
    }
}
