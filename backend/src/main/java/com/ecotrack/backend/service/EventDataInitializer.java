package com.ecotrack.backend.service;

import com.ecotrack.backend.model.Event;
import com.ecotrack.backend.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

@Component
public class EventDataInitializer implements CommandLineRunner {

    @Autowired
    private EventRepository eventRepository;

    @Override
    public void run(String... args) throws Exception {
        // Check if events already exist
        if (eventRepository.count() > 0) {
            return;
        }

        // Create sample events for Coimbatore with specific locations
        Event event1 = new Event(
            "E-waste Collection Drive",
            "Join us for a community e-waste collection drive. Bring your old electronics and gadgets for proper recycling. Free refreshments provided!",
            "Coimbatore - Gass Junction",
            LocalDateTime.now().plusDays(5),
            "COLLECTION_DRIVE"
        );
        event1.setLatitude(11.0066);
        event1.setLongitude(76.9655);
        event1.setOrganizerName("EcoTrack Coimbatore Team");
        event1.setOrganizerContact("+91 8489737878");
        event1.setMaxParticipants(100);
        event1.setCurrentParticipants(0);
        eventRepository.save(event1);

        Event event2 = new Event(
            "Composting Workshop",
            "Learn how to compost food waste at home! This hands-on workshop will teach you best practices for creating nutrient-rich compost for your garden.",
            "Coimbatore - Race Course",
            LocalDateTime.now().plusDays(12),
            "WORKSHOP"
        );
        event2.setLatitude(11.0066);
        event2.setLongitude(76.9655);
        event2.setOrganizerName("Green Coimbatore Initiative");
        event2.setOrganizerContact("+91 8489737878");
        event2.setMaxParticipants(50);
        event2.setCurrentParticipants(0);
        eventRepository.save(event2);

        Event event3 = new Event(
            "Community Clean-Up Drive",
            "Be part of our community clean-up drive to make Coimbatore greener! We'll be cleaning parks and public spaces. All tools provided.",
            "Coimbatore - Brookefields",
            LocalDateTime.now().plusDays(8),
            "CLEANUP"
        );
        event3.setLatitude(11.0066);
        event3.setLongitude(76.9655);
        event3.setOrganizerName("EcoTrack Community");
        event3.setOrganizerContact("+91 8489737878");
        event3.setMaxParticipants(150);
        event3.setCurrentParticipants(0);
        eventRepository.save(event3);

        Event event4 = new Event(
            "Sustainable Living Seminar",
            "Learn about sustainable living practices, zero waste lifestyle, and environmental conservation. Expert speakers will share insights and tips.",
            "Coimbatore - Forum Mall",
            LocalDateTime.now().plusDays(15),
            "EDUCATION"
        );
        event4.setLatitude(11.0066);
        event4.setLongitude(76.9655);
        event4.setOrganizerName("EcoTrack Coimbatore");
        event4.setOrganizerContact("+91 8489737878");
        event4.setMaxParticipants(200);
        event4.setCurrentParticipants(0);
        eventRepository.save(event4);

        Event event5 = new Event(
            "Plastic-Free Shopping Challenge",
            "Join our 30-day plastic-free shopping challenge! Learn tips on how to shop sustainably and reduce plastic waste in your daily life.",
            "Coimbatore - Saibaba Colony",
            LocalDateTime.now().plusDays(3),
            "COMMUNITY_EVENT"
        );
        event5.setLatitude(11.0066);
        event5.setLongitude(76.9655);
        event5.setOrganizerName("EcoTrack Team");
        event5.setOrganizerContact("+91 8489737878");
        event5.setMaxParticipants(300);
        event5.setCurrentParticipants(0);
        eventRepository.save(event5);

        Event event6 = new Event(
            "Tree Planting Festival",
            "Help us plant 500 trees in and around Coimbatore! Join families and communities in this green initiative. Saplings and tools provided.",
            "Coimbatore - Ukkadam",
            LocalDateTime.now().plusDays(20),
            "CLEANUP"
        );
        event6.setLatitude(11.0066);
        event6.setLongitude(76.9655);
        event6.setOrganizerName("Coimbatore Green Corps");
        event6.setOrganizerContact("+91 8489737878");
        event6.setMaxParticipants(250);
        event6.setCurrentParticipants(0);
        eventRepository.save(event6);

        System.out.println("✅ Sample events initialized for Coimbatore!");
    }
}
