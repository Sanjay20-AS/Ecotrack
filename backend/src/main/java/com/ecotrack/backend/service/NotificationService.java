package com.ecotrack.backend.service;

import com.ecotrack.backend.model.Notification;
import com.ecotrack.backend.model.User;
import com.ecotrack.backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public Notification create(User user, String title, String description, String type, String icon) {
        Notification n = new Notification(user, title, description, type, icon);
        return notificationRepository.save(n);
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
