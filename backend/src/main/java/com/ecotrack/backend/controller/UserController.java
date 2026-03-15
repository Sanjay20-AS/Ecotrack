package com.ecotrack.backend.controller;

import com.ecotrack.backend.model.*;
import com.ecotrack.backend.repository.*;
import com.ecotrack.backend.security.JwtUtil;
import com.ecotrack.backend.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WasteRepository wasteRepository;

    @Autowired
    private WastePickupRepository wastePickupRepository;

    @Autowired
    private CommunityRepository communityRepository;

    @Autowired
    private EducationContentRepository educationContentRepository;

    @Autowired
    private MarketplaceItemRepository marketplaceItemRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        Optional<User> user = userRepository.findById(id);
        return user.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody Map<String, Object> signupData) {
        try {
            String email = (String) signupData.get("email");
            String password = (String) signupData.get("password");
            String name = (String) signupData.get("name");
            String phoneNumber = (String) signupData.get("phoneNumber");
            Double latitude = (Double) signupData.get("latitude");
            Double longitude = (Double) signupData.get("longitude");
            String roleString = (String) signupData.get("role");
            
            // Basic validation
            if (email == null || password == null || name == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Missing required fields"));
            }
            
            // Check if email already exists
            if (userRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email already exists"));
            }
            
            // Validate role - only DONOR and COLLECTOR allowed for signup
            Role role = Role.DONOR; // Default
            if (roleString != null && !roleString.isEmpty()) {
                try {
                    role = Role.valueOf(roleString.toUpperCase());
                    if (role == Role.ADMIN) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Admin signup not allowed"));
                    }
                } catch (IllegalArgumentException e) {
                    role = Role.DONOR; // Keep default if invalid role
                }
            }
            
            User user = new User(email, passwordEncoder.encode(password), name, 
                               latitude != null ? latitude : 12.9716, 
                               longitude != null ? longitude : 77.5946);
            user.setRole(role);
            
            // Collectors require admin approval before they can claim pickups
            if (role == Role.COLLECTOR) {
                user.setAccountStatus(AccountStatus.PENDING_APPROVAL);
                
                // Set collector application fields (only for COLLECTOR role)
                String organizationName = (String) signupData.get("organizationName");
                String reasonForCollecting = (String) signupData.get("reasonForCollecting");
                String vehicleType = (String) signupData.get("vehicleType");
                String operationArea = (String) signupData.get("operationArea");
                
                if (organizationName != null && !organizationName.isEmpty()) {
                    user.setOrganizationName(organizationName);
                }
                if (reasonForCollecting != null && !reasonForCollecting.isEmpty()) {
                    user.setReasonForCollecting(reasonForCollecting);
                }
                if (vehicleType != null && !vehicleType.isEmpty()) {
                    user.setVehicleType(vehicleType);
                }
                if (operationArea != null && !operationArea.isEmpty()) {
                    user.setOperationArea(operationArea);
                }
            } else {
                user.setAccountStatus(AccountStatus.ACTIVE);
            }
            
            // Set optional fields
            if (phoneNumber != null && !phoneNumber.isEmpty()) {
                user.setPhoneNumber(phoneNumber);
            }
            
            User savedUser = userRepository.save(user);
            notificationService.notifyWelcome(savedUser);
            String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getEmail(), savedUser.getRole().toString());
            return ResponseEntity.ok(Map.of(
                "id", savedUser.getId(),
                "name", savedUser.getName(),
                "email", savedUser.getEmail(),
                "role", savedUser.getRole().toString(),
                "accountStatus", savedUser.getAccountStatus().toString(),
                "token", token
            ));
        } catch (Exception e) {
            System.err.println("Signup error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Signup failed: " + e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");
        
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User foundUser = userOpt.get();
            boolean authenticated = false;
            
            // Try BCrypt first (new passwords)
            try {
                authenticated = passwordEncoder.matches(password, foundUser.getPassword());
            } catch (Exception e) {
                // Not a BCrypt hash — ignore
            }
            
            // Fallback: plain-text match for legacy passwords, then upgrade to BCrypt
            if (!authenticated && password.equals(foundUser.getPassword())) {
                authenticated = true;
                foundUser.setPassword(passwordEncoder.encode(password));
                userRepository.save(foundUser);
            }
            
            if (authenticated) {
                String token = jwtUtil.generateToken(foundUser.getId(), foundUser.getEmail(),
                    foundUser.getRole() != null ? foundUser.getRole().toString() : "DONOR");
                return ResponseEntity.ok(Map.of(
                    "id", foundUser.getId(),
                    "name", foundUser.getName(),
                    "email", foundUser.getEmail(),
                    "role", foundUser.getRole() != null ? foundUser.getRole().toString() : "DONOR",
                    "accountStatus", foundUser.getAccountStatus() != null ? foundUser.getAccountStatus().toString() : "ACTIVE",
                    "token", token
                ));
            }
        }
        return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String newPassword = body.get("newPassword");
        if (email == null || newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and a password of at least 6 characters are required"));
        }
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "No account found with that email"));
        }
        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Password reset successful"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        Optional<User> user = userRepository.findById(id);
        if (user.isPresent()) {
            User existingUser = user.get();
            if (userDetails.getName() != null) existingUser.setName(userDetails.getName());
            if (userDetails.getPhoneNumber() != null) existingUser.setPhoneNumber(userDetails.getPhoneNumber());
            if (userDetails.getProfilePictureUrl() != null) existingUser.setProfilePictureUrl(userDetails.getProfilePictureUrl());
            if (userDetails.getBio() != null) existingUser.setBio(userDetails.getBio());
            existingUser.setLatitude(userDetails.getLatitude());
            existingUser.setLongitude(userDetails.getLongitude());
            
            User updatedUser = userRepository.save(existingUser);
            return ResponseEntity.ok(updatedUser);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            User user = userOpt.get();

            // 1. Un-assign this user as collector on any waste they claimed
            //    Reset ALL statuses back to PENDING so another collector can pick them up
            List<Waste> collectedWaste = wasteRepository.findByCollectedById(id);
            for (Waste w : collectedWaste) {
                w.setCollectedBy(null);
                w.setCollectorNotes(null);
                w.setStatus("PENDING");
                wasteRepository.save(w);
            }

            // 2. Delete waste pickups linked to waste this user donated
            List<Waste> donatedWaste = wasteRepository.findByUserId(id);
            for (Waste w : donatedWaste) {
                List<WastePickup> pickups = wastePickupRepository.findByWasteId(w.getId());
                wastePickupRepository.deleteAll(pickups);
            }

            // 3. Delete waste donated by this user
            wasteRepository.deleteAll(donatedWaste);

            // 4. Delete communities created by this user
            List<Community> createdCommunities = communityRepository.findByCreatorId(id);
            for (Community c : createdCommunities) {
                // Un-assign members from the community first
                List<User> members = userRepository.findAll().stream()
                    .filter(u -> u.getCommunity() != null && u.getCommunity().getId().equals(c.getId()))
                    .collect(java.util.stream.Collectors.toList());
                for (User m : members) {
                    m.setCommunity(null);
                    userRepository.save(m);
                }
                communityRepository.delete(c);
            }

            // 5. Remove this user's community membership
            if (user.getCommunity() != null) {
                Community comm = user.getCommunity();
                user.setCommunity(null);
                userRepository.save(user);
                comm.setMemberCount(Math.max(0, comm.getMemberCount() - 1));
                communityRepository.save(comm);
            }

            // 6. Delete education content created by this user
            List<EducationContent> edContent = educationContentRepository.findByCreatedByIdOrderByCreatedAtDesc(id);
            educationContentRepository.deleteAll(edContent);

            // 7. Delete marketplace items listed by this user
            List<MarketplaceItem> items = marketplaceItemRepository.findBySellerId(id);
            marketplaceItemRepository.deleteAll(items);

            // 8. Delete all notifications for this user
            List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(id);
            notificationRepository.deleteAll(notifications);

            // 9. Finally delete the user
            userRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Account deleted successfully"));
        } catch (Exception e) {
            System.err.println("Delete user error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete account: " + e.getMessage()));
        }
    }

    // ── Admin: Approve / Reject collector accounts ──

    @PatchMapping("/{id}/account-status")
    public ResponseEntity<?> updateAccountStatus(@PathVariable Long id,
                                                 @RequestBody Map<String, String> body,
                                                 @RequestParam Long adminId) {
        try {
            // Verify admin
            Optional<User> adminOpt = userRepository.findById(adminId);
            if (adminOpt.isEmpty() || adminOpt.get().getRole() != Role.ADMIN) {
                return ResponseEntity.status(403).body(Map.of("error", "Only admins can change account status"));
            }

            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            String newStatus = body.get("accountStatus");
            if (newStatus == null || newStatus.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "accountStatus is required"));
            }

            AccountStatus status;
            try {
                status = AccountStatus.valueOf(newStatus.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid status. Use ACTIVE, PENDING_APPROVAL, or REJECTED"));
            }

            User target = userOpt.get();
            
            // Extract optional reason from request body
            String reason = body.get("reason");
            if (reason != null && !reason.isBlank()) {
                target.setAdminReviewNote(reason);
            }
            
            target.setAccountStatus(status);
            userRepository.save(target);

            // Notify the user about their account status change
            if (status == AccountStatus.ACTIVE) {
                notificationService.notifyAccountApproved(target);
            } else if (status == AccountStatus.REJECTED) {
                notificationService.notifyAccountRejected(target, reason);
            }

            return ResponseEntity.ok(Map.of(
                "id", target.getId(),
                "name", target.getName(),
                "accountStatus", target.getAccountStatus().toString(),
                "message", "Account status updated to " + status
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update status: " + e.getMessage()));
        }
    }

    // ── Get pending collector accounts ──

    @GetMapping("/pending-collectors")
    public ResponseEntity<?> getPendingCollectors(@RequestParam Long adminId) {
        Optional<User> adminOpt = userRepository.findById(adminId);
        if (adminOpt.isEmpty() || adminOpt.get().getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("error", "Only admins can view pending collectors"));
        }

        List<User> pending = userRepository.findAll().stream()
            .filter(u -> u.getRole() == Role.COLLECTOR && u.getAccountStatus() == AccountStatus.PENDING_APPROVAL)
            .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(pending);
    }

    // ── Admin: Platform stats overview ──

    @GetMapping("/admin/stats")
    public ResponseEntity<?> getAdminStats(@RequestParam Long adminId) {
        try {
        Optional<User> adminOpt = userRepository.findById(adminId);
        if (adminOpt.isEmpty() || adminOpt.get().getRole() != Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("error", "Only admins can view platform stats"));
        }

        List<User> allUsers = userRepository.findAll();
        List<Waste> allWaste = wasteRepository.findAll();

        long totalUsers = allUsers.size();
        long totalDonors = allUsers.stream().filter(u -> u.getRole() == Role.DONOR).count();
        long totalCollectors = allUsers.stream().filter(u -> u.getRole() == Role.COLLECTOR).count();
        long pendingCollectors = allUsers.stream()
            .filter(u -> u.getRole() == Role.COLLECTOR && u.getAccountStatus() == AccountStatus.PENDING_APPROVAL).count();
        long activeCollectors = allUsers.stream()
            .filter(u -> u.getRole() == Role.COLLECTOR && u.getAccountStatus() == AccountStatus.ACTIVE).count();

        long totalWaste = allWaste.size();
        long pendingWaste = allWaste.stream().filter(w -> "PENDING".equals(w.getStatus())).count();
        long inProgressWaste = allWaste.stream().filter(w -> "IN_PROGRESS".equals(w.getStatus())).count();
        long collectedWaste = allWaste.stream().filter(w -> "COLLECTED".equals(w.getStatus())).count();
        double totalQuantity = allWaste.stream().mapToDouble(Waste::getQuantity).sum();

        long totalCommunities = communityRepository.count();

        return ResponseEntity.ok(Map.ofEntries(
            Map.entry("totalUsers", totalUsers),
            Map.entry("totalDonors", totalDonors),
            Map.entry("totalCollectors", totalCollectors),
            Map.entry("pendingCollectors", pendingCollectors),
            Map.entry("activeCollectors", activeCollectors),
            Map.entry("totalWaste", totalWaste),
            Map.entry("pendingWaste", pendingWaste),
            Map.entry("inProgressWaste", inProgressWaste),
            Map.entry("collectedWaste", collectedWaste),
            Map.entry("totalQuantityKg", totalQuantity),
            Map.entry("totalCommunities", totalCommunities)
        ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getClass().getName() + ": " + e.getMessage()));
        }
    }
}
