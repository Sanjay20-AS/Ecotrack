package com.ecotrack.backend.service;

import com.ecotrack.backend.model.Notification;
import com.ecotrack.backend.model.User;
import com.ecotrack.backend.model.UserSettings;
import com.ecotrack.backend.repository.NotificationRepository;
import com.ecotrack.backend.repository.UserSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class NotificationService {
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserSettingsRepository userSettingsRepository;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.from:noreply@ecotrack.app}")
    private String fromEmail;

    public Notification create(User user, String title, String description, String type, String icon) {
        Notification n = new Notification(user, title, description, type, icon);
        notificationRepository.save(n);

        // Send email if notifications enabled
        sendEmailNotification(user, title, description);

        return n;
    }

    private void sendEmailNotification(User user, String title, String description) {
        try {
            // Check user settings
            UserSettings settings = userSettingsRepository.findByUserId(user.getId()).orElse(null);
            if (settings == null || !settings.isEmailNotifications()) {
                logger.warn("Email notifications disabled for user " + user.getId());
                return; // User disabled email notifications
            }

            // Skip if mail sender not configured
            if (mailSender == null) {
                logger.warn("JavaMailSender is NULL - Mail not configured");
                return;
            }

            logger.info("Preparing to send email to " + user.getEmail());
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(user.getEmail());
            message.setSubject("EcoTrack: " + title);
            
            String userName = user.getName() != null ? user.getName().split(" ")[0] : "there";
            message.setText("Hello " + userName + ",\n\n" +
                    description + "\n\n" +
                    "Keep making an impact!\n" +
                    "EcoTrack Team\n\n" +
                    "---\n" +
                    "You received this email because you enabled email notifications in your settings.");

            mailSender.send(message);
            logger.info("✅ Email successfully sent to " + user.getEmail() + " for notification: " + title);

        } catch (Exception e) {
            logger.error("❌ Failed to send email notification to " + user.getEmail() + ": " + e.getMessage(), e);
            // Don't throw - email is optional, notification still created in DB
        }
    }

    // ── Pickup lifecycle notifications ──

    public void notifyDonorPickupClaimed(User donor, String wasteType, String collectorName) {
        create(donor,
                "Pickup Claimed",
                "Your " + wasteType + " waste has been claimed by " + collectorName + ". Collection in progress!",
                "PICKUP", "🚚");
    }

    public void notifyDonorPickupCompleted(User donor, String wasteType, String collectorName) {
        create(donor,
                "Waste Collected!",
                "Your " + wasteType + " waste has been successfully collected by " + collectorName + ".",
                "PICKUP", "✅");
    }

    public void notifyCollectorNewWaste(User collector, String wasteType, double quantity) {
        create(collector,
                "New Waste Available",
                String.format("%.1f kg of %s waste has been posted nearby.", quantity, wasteType),
                "PICKUP", "📦");
    }

    // ── Account notifications ──

    public void notifyAccountApproved(User user) {
        String message = "🎉 Congratulations! Your collector application has been approved. You can now start accepting waste pickups. Welcome to EcoTrack!";
        create(user,
                "Account Approved!",
                message,
                "ACCOUNT", "🎉");
    }

    public void notifyAccountRejected(User user, String reason) {
        String message;
        if (reason != null && !reason.isBlank()) {
            message = "Your collector application was reviewed. Unfortunately it was not approved at this time. Reason: " + reason + ". You may reapply after addressing the feedback.";
        } else {
            message = "Your collector application was reviewed. Unfortunately it was not approved at this time. Please contact support@ecotrack.app for more information.";
        }
        create(user,
                "Application Status Update",
                message,
                "ACCOUNT", "⚠️");
    }

    // ── Community notifications ──

    public void notifyCommunityJoined(User user, String communityName) {
        create(user,
                "Welcome to " + communityName + "!",
                "You've joined the " + communityName + " community. Check out the leaderboard!",
                "COMMUNITY", "🌍");
    }

    // ── Welcome notification ──

    public void notifyWelcome(User user) {
        create(user,
                "Welcome to EcoTrack!",
                "Start tracking your waste and making a positive impact on the environment.",
                "SYSTEM", "🌱");
    }
}
