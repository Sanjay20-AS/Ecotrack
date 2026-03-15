package com.ecotrack.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "badges")
public class Badge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private String icon;

    @Column(nullable = false)
    private double threshold;

    @Column(nullable = false)
    private String metric; // ENTRIES, TOTAL_KG, CO2_SAVED

    public Badge() {}

    public Badge(String name, String description, String icon, double threshold, String metric) {
        this.name = name;
        this.description = description;
        this.icon = icon;
        this.threshold = threshold;
        this.metric = metric;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public double getThreshold() { return threshold; }
    public void setThreshold(double threshold) { this.threshold = threshold; }
    public String getMetric() { return metric; }
    public void setMetric(String metric) { this.metric = metric; }
}
