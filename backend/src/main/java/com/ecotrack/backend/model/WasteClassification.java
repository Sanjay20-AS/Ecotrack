package com.ecotrack.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "waste_classifications")
public class WasteClassification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "predicted_category")
    private String predictedCategory;

    @Column(name = "item_name")
    private String itemName;

    @Column(name = "predicted_condition")
    private String predictedCondition;

    @Column(name = "predicted_disposal")
    private String predictedDisposal;

    @Column(name = "estimated_weight")
    private double estimatedWeight;

    @Column(name = "confidence_score")
    private int confidenceScore;

    @Column(name = "notes", length = 1000)
    private String notes;

    @Column(name = "was_accepted")
    private boolean wasAccepted;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public String getPredictedCategory() { return predictedCategory; }
    public void setPredictedCategory(String predictedCategory) { this.predictedCategory = predictedCategory; }

    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }

    public String getPredictedCondition() { return predictedCondition; }
    public void setPredictedCondition(String predictedCondition) { this.predictedCondition = predictedCondition; }

    public String getPredictedDisposal() { return predictedDisposal; }
    public void setPredictedDisposal(String predictedDisposal) { this.predictedDisposal = predictedDisposal; }

    public double getEstimatedWeight() { return estimatedWeight; }
    public void setEstimatedWeight(double estimatedWeight) { this.estimatedWeight = estimatedWeight; }

    public int getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(int confidenceScore) { this.confidenceScore = confidenceScore; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public boolean isWasAccepted() { return wasAccepted; }
    public void setWasAccepted(boolean wasAccepted) { this.wasAccepted = wasAccepted; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
