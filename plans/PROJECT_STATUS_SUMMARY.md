# EcoTrack — Project Implementation Status

**Date:** March 6, 2026  
**Tech Stack:** React 19 + TypeScript (Vite) | Spring Boot 4.0.1 + Java 17 | PostgreSQL 16  
**Repository:** https://github.com/Sanjay20-AS/Ecotrack

---

## 1. Backend Summary

### Entities (7 Database Tables)

| Entity | Table | Key Fields | Status |
|--------|-------|------------|--------|
| **User** | `users` | email, password, name, role (DONOR/COLLECTOR/ADMIN), accountStatus, lat/lng, community FK | ✅ Fully implemented |
| **Waste** | `waste` | type, quantity, description, location, status (PENDING/IN_PROGRESS/COLLECTED), collectedBy FK, claimedAt, collectionPhotoUrl, collectorLat/Lng | ✅ Fully implemented |
| **Facility** | `facilities` | name, type, lat/lng, capacityKg, currentUsageKg, operatingHours, isActive | ✅ Fully implemented |
| **WastePickup** | `waste_pickups` | waste FK, facility FK, pickupSchedule, scheduledDate, status | ✅ Schema exists (used indirectly) |
| **Community** | `communities` | name, description, category, memberCount, creator FK | ✅ Fully implemented |
| **EducationContent** | `education_content` | title, content, category, difficulty, videoUrl, viewsCount | ⚠️ Entity + Repository only (no controller) |
| **MarketplaceItem** | `marketplace_items` | title, description, category, price, seller FK, status | ⚠️ Entity + Repository only (no controller) |

### Controllers & API Endpoints (6 Controllers, 40+ Endpoints)

| Controller | Base Path | Endpoints | Status |
|------------|-----------|-----------|--------|
| **UserController** | `/api/users` | signup, login, CRUD, account-status (admin), pending-collectors | ✅ Fully working |
| **WasteTrackingController** | `/api/waste` | CRUD, status updates, user/collector analytics, trends, dashboard stats, collector history | ✅ Fully working |
| **WasteController** | `/api/waste` | priority calculation, pickup scheduling | ✅ Fully working |
| **FacilityController** | `/api/waste` | nearest-facility lookup | ✅ Fully working |
| **FacilityManagementController** | `/api/facilities` | CRUD for facilities, filter by type/active, nearest lookup | ✅ Fully working |
| **CommunityController** | `/api/communities` | create/join/leave, members, leaderboard, stats, search | ✅ Fully working |
| **FileUploadController** | `/api/upload` | waste-image upload (10 MB limit, image validation) | ✅ Fully working |

### Services & Algorithms (3 Algorithm Services)

| Service | Purpose | Status |
|---------|---------|--------|
| **WastePriorityService** | Scores waste urgency using type weight × quantity + age − distance | ✅ Working (used by TrackWaste + CollectorDashboard) |
| **PickupSchedulingService** | Suggests pickup schedule (IMMEDIATE/PRIORITY/STANDARD/BULK) based on type, quantity, age | ✅ Working (used by TrackWaste + CollectorPickups) |
| **FacilityMatchingService** | Finds nearest facility using Haversine distance formula | ✅ Working (used by TrackWaste + Locations) |
| **WasteValidationService** | Validates waste creation requests (type, quantity, coords, description) | ✅ Working |
| **FacilityDataInitializer** | Seeds 5 default facilities on first startup | ✅ Working |

### Backend Validation Rules (Pickup Completion)

These 5 server-side validations enforce pickup integrity:

1. **Strict status transitions** — PENDING → IN_PROGRESS → COLLECTED only (no skipping)
2. **5-minute minimum** — Collector must wait ≥ 5 min between claiming and completing
3. **Mandatory photo** — Collection photo upload required before marking COLLECTED
4. **GPS capture required** — Collector's live GPS coordinates must be submitted
5. **200-meter distance check** — Collector must be within 200 m of the pickup location (Haversine)

### Authentication & Authorization

| Feature | Details |
|---------|---------|
| **Roles** | DONOR, COLLECTOR, ADMIN |
| **Account Status** | PENDING_APPROVAL (new collectors), ACTIVE, REJECTED |
| **Admin endpoints** | Approve/reject collectors, view pending list |
| **Auth method** | Email + password (stored in DB, no JWT/sessions — simple login) |
| **CORS** | Configured for localhost:5173, localhost:3000, 127.0.0.1:5173 |

---

## 2. Frontend Summary

### Screens — Fully Functional (Real API) ✅

| # | Screen | Role | Key Features |
|---|--------|------|-------------|
| 1 | **LoginScreen** | All | Email/password login, role detection, localStorage session |
| 2 | **SignupScreen** | All | Registration with role selection (Donor/Collector), validation |
| 3 | **HomeScreen** | Donor | Dashboard with live waste stats, CO₂ saved, recent donations (30 s auto-refresh) |
| 4 | **TrackWasteScreen** | Donor | Waste logging form (type, qty, description, photo, location), camera capture, upload, submission insights (priority score + pickup schedule + nearest facility) |
| 5 | **DonationTrackingScreen** | Donor | Live donation status tracking with 15 s polling, 3-step progress bar (Pending → Assigned → Collected), expandable details |
| 6 | **LocationsScreen** | Donor | Dual view (List + Leaflet Map), facility search/filter, custom map markers, user location |
| 7 | **CommunityScreen** | All | Create/join/leave communities, member list, leaderboard (ranked), stats, search |
| 8 | **ProfileScreen** | All | View/edit profile, waste stats, delete account |
| 9 | **AnalyticsScreen** | All | Time-range analytics (week/month/year), trend charts, category breakdowns, global stats — role-aware (donor vs collector data) |
| 10 | **CollectorDashboardScreen** | Collector | Today/week/month stats, urgent pickup alerts, daily goal tracking, CO₂ impact, account status warnings |
| 11 | **CollectorPickupsScreen** | Collector | Manage all pickups — claim (PENDING → IN_PROGRESS), complete with photo + GPS, filter/sort/search, priority scores, nearest facility |
| 12 | **CollectorRoutesScreen** | Collector | Leaflet map with pending/in-progress markers, route polylines, facility markers, claim/collect from map |
| 13 | **CollectorHistoryScreen** | Collector | Completed pickup history with search, donor info, collector notes |

### Screens — Mock Data / Partially Implemented ⚠️

| # | Screen | What Works | What's Missing |
|---|--------|------------|----------------|
| 14 | **OnboardingScreen** | 3-step wizard UI renders | Inputs not saved to backend; goals/permissions are decorative |
| 15 | **MarketplaceScreen** | Grid UI, category filters, search | **All items are hardcoded**; no API integration (backend entity + repo exist but no controller) |
| 16 | **EducationScreen** | Featured content cards, topic grid, progress bar | **All content is hardcoded**; no API integration (backend entity + repo exist but no controller) |
| 17 | **NotificationsScreen** | Notification list, mark read, delete | **All notifications are hardcoded client-side**; no backend support |
| 18 | **HelpScreen** | FAQ accordion, contact form | Contact form **logs to console only**; no backend submission |
| 19 | **SettingsScreen** | Toggle switches, delete account | Toggles are **local state only** (dark mode, notifications, privacy not persisted); only delete account calls real API |

---

## 3. End-to-End Working Flows

### Flow 1: Donor Waste Logging
```
Signup (DONOR) → Login → HomeScreen → TrackWaste → Fill form → Capture photo
→ Submit → Backend validates → Waste created (PENDING)
→ HomeScreen shows new entry → DonationTracking shows live status
```

### Flow 2: Collector Pickup Lifecycle
```
Signup (COLLECTOR, status=PENDING_APPROVAL) → Admin approves (PATCH account-status)
→ Login → CollectorDashboard (stats, urgent alerts)
→ CollectorPickups → Claim pickup (PENDING → IN_PROGRESS, claimedAt recorded)
→ Wait ≥ 5 min → Upload photo → GPS captured → Within 200 m verified
→ Mark Collected → Donor sees "Collected" in DonationTracking
```

### Flow 3: Community Engagement
```
Login → CommunityScreen → Create or Join community → View members
→ Leaderboard ranks members by total waste logged → Leave community
```

### Flow 4: Analytics
```
Login → AnalyticsScreen → Select time range (week/month/year)
→ View personal stats + trends + category breakdown + global comparison
```

---

## 4. Algorithms Integrated Into Screens

| Algorithm | Where Used (Frontend) | Purpose |
|-----------|-----------------------|---------|
| **Waste Priority Score** | TrackWasteScreen (after submission), CollectorDashboardScreen (urgency calc), CollectorPickupsScreen (sort by priority) | Ranks waste items by urgency |
| **Pickup Scheduling** | TrackWasteScreen (submission insights), CollectorPickupsScreen (schedule display) | Suggests IMMEDIATE / PRIORITY / STANDARD / BULK timing |
| **Facility Matching** | TrackWasteScreen (nearest facility insight), LocationsScreen (map), CollectorRoutesScreen (facility markers) | Finds nearest disposal point via Haversine |

---

## 5. UI / UX Features

| Feature | Details |
|---------|---------|
| **Component Library** | shadcn/ui (40+ components: Card, Dialog, Tabs, Badge, Progress, etc.) |
| **Icons** | lucide-react |
| **Maps** | react-leaflet with custom emoji markers and polyline routes |
| **Notifications** | react-hot-toast (global Toaster, success/error toasts on all API calls) |
| **Responsive Layout** | Mobile-first with fixed bottom navigation |
| **Role-Based Navigation** | Donor nav (Home, Track, Status, Locations, Community, Profile) vs Collector nav (Dashboard, Pickups, History, Routes, Profile) |
| **Account Status Gating** | Warning banners + disabled actions for PENDING_APPROVAL / REJECTED collectors |
| **Live Polling** | HomeScreen (30 s), DonationTracking (15 s) with pause/resume |
| **Camera Integration** | Environment/user-facing camera capture for waste + collection photos |
| **Geolocation** | GPS capture for waste logging and collection verification |

---

## 6. What's NOT Implemented

| Feature | Backend | Frontend | Notes |
|---------|---------|----------|-------|
| Marketplace CRUD | Entity + Repo exist | Mock UI only | No controller — needs API endpoints + screen wiring |
| Education Content CRUD | Entity + Repo exist | Mock UI only | No controller — needs API endpoints + screen wiring |
| Notifications | Nothing | Mock UI only | No entity, no backend — needs full implementation |
| Settings persistence | Nothing | Local toggles only | Dark mode, notification prefs, privacy not saved |
| Help / Contact form | Nothing | Console log only | No backend endpoint for contact submissions |
| Onboarding data save | Nothing | UI wizard only | Goals, community search, permissions not persisted |
| JWT / Token auth | N/A | N/A | Currently using simple email+password login (no tokens) |
| Password hashing | N/A | N/A | Passwords stored as plain text in DB |
| Admin dashboard UI | API exists | No screen | Admin can approve/reject via API but no dedicated UI |

---

## 7. Database & Infrastructure

| Item | Details |
|------|---------|
| **Database** | PostgreSQL 16 on localhost:5432, database: `ecotrack_db` |
| **Schema management** | Hibernate `ddl-auto=update` (auto-creates/updates tables) |
| **Seed data** | 5 facilities auto-created on first startup via FacilityDataInitializer |
| **File storage** | Local disk (`uploads/waste-photos/`), no cloud storage |
| **Frontend dev server** | Vite on port 5173 |
| **Backend server** | Spring Boot on port 8080 |
| **Styling** | Tailwind CSS + custom theme (primary=#228B22, secondary=#8B4513, accent=#87CEAB) |

---

## 8. Quick Stats

| Metric | Count |
|--------|-------|
| Backend entities | 7 |
| API endpoints | 40+ |
| Algorithm services | 3 |
| Frontend screens | 19 |
| Screens with real API | 13 |
| Screens with mock data | 6 |
| UI components (shadcn) | 40+ |
| Database tables | 7 |
