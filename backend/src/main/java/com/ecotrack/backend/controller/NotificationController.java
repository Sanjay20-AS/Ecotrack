package com.ecotrack.backend.controller;

import com.ecotrack.backend.model.Notification;
import com.ecotrack.backend.model.User;
import com.ecotrack.backend.repository.NotificationRepository;
import com.ecotrack.backend.repository.UserRepository;
import com.ecotrack.backend.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    // GET /api/notifications/user/{userId}?page=0&size=20
    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<Notification>> getUserNotifications(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Notification> notifications = notificationRepository.findByUserId(userId, pageable);
        return ResponseEntity.ok(notifications);
    }

    // GET /api/notifications/user/{userId}/latest - Dashboard notifications
    @GetMapping("/user/{userId}/latest")
    public ResponseEntity<List<Notification>> getLatestNotifications(@PathVariable Long userId) {
        Pageable pageable = PageRequest.of(0, 5, Sort.by("createdAt").descending());
        Page<Notification> notifications = notificationRepository.findByUserId(userId, pageable);
        return ResponseEntity.ok(notifications.getContent());
    }

    // GET /api/notifications/user/{userId}/unread
    @GetMapping("/user/{userId}/unread")
    public Map<String, Object> getUnreadInfo(@PathVariable Long userId) {
        long count = notificationRepository.countByUserIdAndReadFalse(userId);
        return Map.of("unreadCount", count);
    }

    // PATCH /api/notifications/{id}/read
    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        Optional<Notification> opt = notificationRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Notification n = opt.get();
        n.setRead(true);
        notificationRepository.save(n);
        return ResponseEntity.ok(n);
    }

    // PATCH /api/notifications/user/{userId}/read-all
    @PatchMapping("/user/{userId}/read-all")
    public ResponseEntity<?> markAllAsRead(@PathVariable Long userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
        return ResponseEntity.ok(Map.of("markedRead", unread.size()));
    }

    // DELETE /api/notifications/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id) {
        if (!notificationRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        notificationRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("deleted", true));
    }

    // DELETE /api/notifications/user/{userId}/all
    @DeleteMapping("/user/{userId}/all")
    public ResponseEntity<?> deleteAllNotifications(@PathVariable Long userId) {
        List<Notification> notifications = notificationRepository.findByUserId(userId);
        notificationRepository.deleteAll(notifications);
        return ResponseEntity.ok(Map.of("deleted", notifications.size()));
    }

    // POST /api/notifications/test/{userId} - Send test notification
    @PostMapping("/test/{userId}")
    public ResponseEntity<String> sendTestNotification(@PathVariable Long userId) {
        Optional<User> user = userRepository.findById(userId);
        if (user.isPresent()) {
            notificationService.create(
                    user.get(),
                    "Test Notification",
                    "This is a test notification from EcoTrack. Check your settings to manage notifications.",
                    "SYSTEM",
                    "🔔"
            );
            return ResponseEntity.ok("Test notification sent (check email if enabled)");
        }
        return ResponseEntity.notFound().build();
    }
}

