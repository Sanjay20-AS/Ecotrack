package com.ecotrack.backend.controller;

import com.ecotrack.backend.model.UserSettings;
import com.ecotrack.backend.repository.UserSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    @Autowired
    private UserSettingsRepository userSettingsRepository;

    @GetMapping("/{userId}")
    public ResponseEntity<UserSettings> getSettings(@PathVariable Long userId) {
        UserSettings settings = userSettingsRepository.findByUserId(userId)
                .orElseGet(() -> {
                    UserSettings defaults = new UserSettings(userId);
                    return userSettingsRepository.save(defaults);
                });
        return ResponseEntity.ok(settings);
    }

    @PutMapping("/{userId}")
    public ResponseEntity<UserSettings> updateSettings(
            @PathVariable Long userId,
            @RequestBody Map<String, Object> body) {

        UserSettings settings = userSettingsRepository.findByUserId(userId)
                .orElse(new UserSettings(userId));

        if (body.containsKey("theme"))
            settings.setTheme(body.get("theme").toString());
        if (body.containsKey("notificationsEnabled"))
            settings.setNotificationsEnabled(Boolean.parseBoolean(body.get("notificationsEnabled").toString()));
        if (body.containsKey("emailNotifications"))
            settings.setEmailNotifications(Boolean.parseBoolean(body.get("emailNotifications").toString()));
        if (body.containsKey("soundEnabled"))
            settings.setSoundEnabled(Boolean.parseBoolean(body.get("soundEnabled").toString()));
        if (body.containsKey("dataCollection"))
            settings.setDataCollection(Boolean.parseBoolean(body.get("dataCollection").toString()));
        if (body.containsKey("privacy"))
            settings.setPrivacy(body.get("privacy").toString());

        settings.setUpdatedAt(LocalDateTime.now());
        return ResponseEntity.ok(userSettingsRepository.save(settings));
    }
}
