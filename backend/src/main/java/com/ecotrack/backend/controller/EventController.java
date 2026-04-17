package com.ecotrack.backend.controller;

import com.ecotrack.backend.model.Event;
import com.ecotrack.backend.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "*")
public class EventController {

    @Autowired
    private EventRepository eventRepository;

    @GetMapping
    public ResponseEntity<List<Event>> getAllEvents() {
        return ResponseEntity.ok(eventRepository.findAll());
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<Event>> getUpcomingEvents() {
        List<Event> events = eventRepository.findUpcomingEvents(LocalDateTime.now());
        return ResponseEntity.ok(events);
    }

    @GetMapping("/upcoming/location/{location}")
    public ResponseEntity<List<Event>> getUpcomingEventsByLocation(@PathVariable String location) {
        List<Event> events = eventRepository.findUpcomingEventsByLocation(location, LocalDateTime.now());
        return ResponseEntity.ok(events);
    }

    @GetMapping("/upcoming/category/{category}")
    public ResponseEntity<List<Event>> getUpcomingEventsByCategory(@PathVariable String category) {
        List<Event> events = eventRepository.findUpcomingEventsByCategory(category, LocalDateTime.now());
        return ResponseEntity.ok(events);
    }

    @GetMapping("/upcoming/location/{location}/category/{category}")
    public ResponseEntity<List<Event>> getUpcomingEventsByLocationAndCategory(
            @PathVariable String location,
            @PathVariable String category) {
        List<Event> events = eventRepository.findUpcomingEventsByLocationAndCategory(location, category, LocalDateTime.now());
        return ResponseEntity.ok(events);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Event> getEventById(@PathVariable Long id) {
        Optional<Event> event = eventRepository.findById(id);
        return event.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Event> createEvent(@RequestBody Event event) {
        event.setCreatedAt(LocalDateTime.now());
        event.setUpdatedAt(LocalDateTime.now());
        Event savedEvent = eventRepository.save(event);
        return ResponseEntity.ok(savedEvent);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Event> updateEvent(@PathVariable Long id, @RequestBody Event eventDetails) {
        Optional<Event> optionalEvent = eventRepository.findById(id);
        if (optionalEvent.isPresent()) {
            Event event = optionalEvent.get();
            if (eventDetails.getTitle() != null) event.setTitle(eventDetails.getTitle());
            if (eventDetails.getDescription() != null) event.setDescription(eventDetails.getDescription());
            if (eventDetails.getLocation() != null) event.setLocation(eventDetails.getLocation());
            if (eventDetails.getEventDate() != null) event.setEventDate(eventDetails.getEventDate());
            if (eventDetails.getCategory() != null) event.setCategory(eventDetails.getCategory());
            if (eventDetails.getImageUrl() != null) event.setImageUrl(eventDetails.getImageUrl());
            if (eventDetails.getOrganizerName() != null) event.setOrganizerName(eventDetails.getOrganizerName());
            if (eventDetails.getOrganizerContact() != null) event.setOrganizerContact(eventDetails.getOrganizerContact());
            if (eventDetails.getMaxParticipants() != null) event.setMaxParticipants(eventDetails.getMaxParticipants());
            if (eventDetails.getLatitude() != null) event.setLatitude(eventDetails.getLatitude());
            if (eventDetails.getLongitude() != null) event.setLongitude(eventDetails.getLongitude());
            
            event.setUpdatedAt(LocalDateTime.now());
            Event updatedEvent = eventRepository.save(event);
            return ResponseEntity.ok(updatedEvent);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        if (eventRepository.existsById(id)) {
            eventRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
