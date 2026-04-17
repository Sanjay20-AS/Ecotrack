# Notification System Documentation

## Overview
The EcoTrack notification system provides both **push notifications** (in-app) and **email notifications** with intelligent opt-out controls in the Settings screen.

## Architecture

### Backend Components

**NotificationService.java**
- Creates in-app notifications in the database
- Sends emails when user has enabled email notifications
- Automatically checks UserSettings before sending emails
- Gracefully handles email failures (notifications still created in DB)

**Notification Model**
- `id`: Unique identifier
- `user`: Reference to recipient user
- `title`: Notification title
- `description`: Full notification message
- `type`: Category (PICKUP, ACHIEVEMENT, COMMUNITY, FACILITY, ACCOUNT, SYSTEM)
- `icon`: Emoji icon for visual identification
- `read`: Boolean for read/unread status
- `pushSent`: Tracks if push notification was delivered
- `emailSent`: Tracks if email was delivered
- `createdAt`: Timestamp

**NotificationController.java**
- `GET /api/notifications/user/{userId}` - Fetch paginated notifications
- `GET /api/notifications/user/{userId}/latest` - Get latest 5 (for dashboard)
- `GET /api/notifications/user/{userId}/unread` - Get unread count
- `PATCH /api/notifications/{id}/read` - Mark single as read
- `PATCH /api/notifications/user/{userId}/read-all` - Mark all as read  
- `DELETE /api/notifications/{id}` - Delete notification
- `DELETE /api/notifications/user/{userId}/all` - Delete all notifications
- `POST /api/notifications/test/{userId}` - Send test notification

### Frontend Components

**NotificationsScreen.tsx**
- Displays paginated list of notifications
- Marks notifications as read/unread
- Delete individual or all notifications
- Shows unread badge count
- Real-time updates every 30 seconds from TopBar

**TopBar.tsx**
- Shows bell icon with unread notification count badge
- Refreshes unread count every 30 seconds
- Navigates to NotificationsScreen on click

## Configuration

### Email Setup
Edit `application.properties` to configure your SMTP server:

```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
spring.mail.from=noreply@ecotrack.app
```

**For Gmail:**
- Use an [App Password](https://support.google.com/accounts/answer/185833) (not your regular password)
- Enable "Less secure app access" if not using App Passwords

**For Other Providers:**
Replace SMTP host/port with your provider's details (e.g., Sendgrid, Mailgun, AWS SES)

### User Settings
Users can control notifications in Settings screen:
- **Notifications Enabled** - Toggle push notifications on/off
- **Email Notifications** - Toggle email notifications on/off

## How Notifications Are Triggered

### Waste Pickup Lifecycle
1. **New Waste Posted** → Collectors near location receive notifications
2. **Pickup Claimed** → Donor receives notification when collector claims their waste
3. **Pickup Completed** → Donor receives notification when waste is collected

### Account Events
- Account approved/rejected
- Community joined
- Welcome notification on signup

### Integration Points
Notifications are triggered in `WasteTrackingController.java`:
```java
notificationService.notifyDonorPickupClaimed(donor, wasteType, collectorName);
notificationService.notifyDonorPickupCompleted(donor, wasteType, collectorName);
notificationService.notifyCollectorNewWaste(collector, wasteType, quantity);
```

## Testing

### Send Test Notification
```bash
curl -X POST http://localhost:8080/api/notifications/test/1
```
Replace `1` with a valid user ID.

### Check Notifications
```bash
curl http://localhost:8080/api/notifications/user/1
```

### View Unread Count
```bash
curl http://localhost:8080/api/notifications/user/1/unread
```

## Email Notification Flow

```
User Action (e.g., waste picked up)
    ↓
NotificationService.create() called
    ↓
Notification saved to database ✓
    ↓
Check UserSettings.emailNotifications
    ↓
    ├─ If ENABLED → Send email
    │  ├─ If SUCCESS → Mark emailSent=true
    │  └─ If FAILURE → Log error (don't throw)
    │
    └─ If DISABLED → Skip email
```

## Email Template
Emails are sent with this structure:
```
Subject: EcoTrack: [Notification Title]

Hello [User First Name],

[Notification description]

Keep making an impact!
EcoTrack Team

---
You received this email because you enabled email notifications in your settings.
```

## Push Notifications (Frontend)
Push notifications appear as the in-app notification badge on the bell icon in TopBar. To implement browser push notifications (optional future enhancement):

1. Register Service Worker
2. Request notification permission
3. Call Web Push API when notification created
4. Display browser notification

Currently, notifications are delivered via:
- **Backend**: Database records
- **Frontend**: In-app badge + NotificationsScreen
- **Email**: SMTP if enabled

## Troubleshooting

### Emails Not Sending
1. Check `application.properties` SMTP settings
2. Verify `UserSettings.emailNotifications` is true for user
3. Check backend logs for mail sender errors
4. Ensure email is configured in DB (not null)

### Notifications Not Appearing
1. Verify notification was created: `GET /api/notifications/user/{userId}`
2. Check unread count: `GET /api/notifications/user/{userId}/unread`
3. Verify user ID is correct in localStorage
4. Check if notifications are being marked as read immediately

### Test Email Flow
1. Create a test user
2. Enable email notifications in Settings
3. Send test notification: `POST /api/notifications/test/{userId}`
4. Check inbox (may take a few seconds)

## Future Enhancements

- [ ] SMS notifications
- [ ] Browser push notifications (Web Push API)
- [ ] Notification scheduling/batching
- [ ] Notification channels/topics
- [ ] WebSocket real-time updates (instead of polling)
- [ ] Notification history with archiving
- [ ] Notification preferences by type
- [ ] In-app notification bell with dropdown

