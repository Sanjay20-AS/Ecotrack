package com.ecotrack.backend.controller;

import com.ecotrack.backend.model.SupportTicket;
import com.ecotrack.backend.repository.SupportTicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/support")
public class SupportController {

    @Autowired
    private SupportTicketRepository supportTicketRepository;

    @PostMapping("/tickets")
    public ResponseEntity<?> submitTicket(@RequestBody Map<String, Object> body) {
        try {
            Long userId = Long.valueOf(body.get("userId").toString());
            String subject = body.get("subject").toString().trim();
            String message = body.get("message").toString().trim();

            if (subject.isEmpty() || message.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Subject and message are required"));
            }
            if (message.length() > 5000) {
                return ResponseEntity.badRequest().body(Map.of("error", "Message too long (max 5000 chars)"));
            }

            SupportTicket ticket = new SupportTicket(userId, subject, message);
            SupportTicket saved = supportTicketRepository.save(ticket);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to submit ticket"));
        }
    }

    @GetMapping("/tickets/user/{userId}")
    public List<SupportTicket> getUserTickets(@PathVariable Long userId) {
        return supportTicketRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
}
