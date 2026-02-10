package com.ecotrack.backend.controller;

import com.ecotrack.backend.model.User;
import com.ecotrack.backend.model.Role;
import com.ecotrack.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"})
public class UserController {

    @Autowired
    private UserRepository userRepository;

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
            
            User user = new User(email, password, name, 
                               latitude != null ? latitude : 12.9716, 
                               longitude != null ? longitude : 77.5946);
            user.setRole(role);
            
            // Set optional fields
            if (phoneNumber != null && !phoneNumber.isEmpty()) {
                user.setPhoneNumber(phoneNumber);
            }
            
            User savedUser = userRepository.save(user);
            return ResponseEntity.ok(Map.of(
                "id", savedUser.getId(),
                "name", savedUser.getName(),
                "email", savedUser.getEmail(),
                "role", savedUser.getRole().toString()
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
        
        Optional<User> user = userRepository.findByEmailAndPassword(email, password);
        if (user.isPresent()) {
            User foundUser = user.get();
            return ResponseEntity.ok(Map.of(
                "id", foundUser.getId(),
                "name", foundUser.getName(),
                "email", foundUser.getEmail(),
                "role", foundUser.getRole() != null ? foundUser.getRole().toString() : "DONOR"
            ));
        }
        return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
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
            if (!userRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            
            userRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Account deleted successfully"));
        } catch (Exception e) {
            System.err.println("Delete user error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete account: " + e.getMessage()));
        }
    }
}
