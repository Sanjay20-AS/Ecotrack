package com.ecotrack.backend.service;

import com.ecotrack.backend.model.Badge;
import com.ecotrack.backend.repository.BadgeRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class BadgeDataInitializer implements CommandLineRunner {

    private final BadgeRepository badgeRepository;

    public BadgeDataInitializer(BadgeRepository badgeRepository) {
        this.badgeRepository = badgeRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (badgeRepository.count() > 0) return;

        badgeRepository.save(new Badge("First Step", "Log your first waste entry", "🌱", 1, "ENTRIES"));
        badgeRepository.save(new Badge("Getting Started", "Log 5 waste entries", "♻️", 5, "ENTRIES"));
        badgeRepository.save(new Badge("Eco Enthusiast", "Log 20 waste entries", "🌿", 20, "ENTRIES"));
        badgeRepository.save(new Badge("Waste Warrior", "Log 50 waste entries", "⚔️", 50, "ENTRIES"));
        badgeRepository.save(new Badge("Century Club", "Log 100 waste entries", "💯", 100, "ENTRIES"));

        badgeRepository.save(new Badge("Lightweight", "Recycle 5 kg of waste", "⚖️", 5, "TOTAL_KG"));
        badgeRepository.save(new Badge("Heavy Lifter", "Recycle 25 kg of waste", "🏋️", 25, "TOTAL_KG"));
        badgeRepository.save(new Badge("Ton Handler", "Recycle 100 kg of waste", "🚚", 100, "TOTAL_KG"));

        badgeRepository.save(new Badge("Carbon Cutter", "Save 10 kg of CO₂ emissions", "🌍", 10, "CO2_SAVED"));
        badgeRepository.save(new Badge("Climate Champion", "Save 50 kg of CO₂ emissions", "🏆", 50, "CO2_SAVED"));
    }
}
