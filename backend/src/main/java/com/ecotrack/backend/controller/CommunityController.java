package com.ecotrack.backend.controller;

import com.ecotrack.backend.model.Community;
import com.ecotrack.backend.model.User;
import com.ecotrack.backend.repository.CommunityRepository;
import com.ecotrack.backend.repository.UserRepository;
import com.ecotrack.backend.repository.WasteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/communities")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://127.0.0.1:5173"})
public class CommunityController {

    @Autowired
    private CommunityRepository communityRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private WasteRepository wasteRepository;

    @GetMapping
    public List<Community> getAllCommunities() {
        return communityRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Community> getCommunityById(@PathVariable Long id) {
        Optional<Community> community = communityRepository.findById(id);
        return community.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/create")
    public ResponseEntity<?> createCommunity(@RequestBody Map<String, Object> communityData) {
        try {
            String name = (String) communityData.get("name");
            String description = (String) communityData.get("description");
            String category = (String) communityData.get("category");
            Long creatorId = Long.valueOf(communityData.get("creatorId").toString());
            
            // Basic validation
            if (name == null || description == null || creatorId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Missing required fields"));
            }
            
            // Check if community name already exists
            List<Community> existing = communityRepository.findAll();
            if (existing.stream().anyMatch(c -> c.getName().equalsIgnoreCase(name))) {
                return ResponseEntity.badRequest().body(Map.of("error", "Community name already exists"));
            }
            
            // Find creator user
            Optional<User> creatorOpt = userRepository.findById(creatorId);
            if (!creatorOpt.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Creator user not found"));
            }
            
            User creator = creatorOpt.get();
            
            // Create community
            Community community = new Community(name, description, creator, category);
            Community savedCommunity = communityRepository.save(community);
            
            // Auto-join creator to the community
            creator.setCommunity(savedCommunity);
            userRepository.save(creator);
            
            return ResponseEntity.ok(savedCommunity);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to create community: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<?> joinCommunity(@PathVariable Long id, @RequestBody Map<String, Object> joinData) {
        try {
            Long userId = Long.valueOf(joinData.get("userId").toString());
            
            // Find community
            Optional<Community> communityOpt = communityRepository.findById(id);
            if (!communityOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            // Find user
            Optional<User> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }
            
            Community community = communityOpt.get();
            User user = userOpt.get();
            
            // Check if user is already in a community (one community per user requirement)
            if (user.getCommunity() != null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User is already in a community"));
            }
            
            // Join user to community
            user.setCommunity(community);
            userRepository.save(user);
            
            // Update member count
            community.setMemberCount(community.getMemberCount() + 1);
            community.setUpdatedAt(LocalDateTime.now());
            communityRepository.save(community);
            
            return ResponseEntity.ok(Map.of("message", "Successfully joined community", "community", community));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to join community: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<?> leaveCommunity(@PathVariable Long id, @RequestBody Map<String, Object> leaveData) {
        try {
            Long userId = Long.valueOf(leaveData.get("userId").toString());
            
            // Find community
            Optional<Community> communityOpt = communityRepository.findById(id);
            if (!communityOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            // Find user
            Optional<User> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }
            
            Community community = communityOpt.get();
            User user = userOpt.get();
            
            // Check if user is in this community
            if (user.getCommunity() == null || !user.getCommunity().getId().equals(id)) {
                return ResponseEntity.badRequest().body(Map.of("error", "User is not in this community"));
            }
            
            // Remove user from community
            user.setCommunity(null);
            userRepository.save(user);
            
            // Update member count
            community.setMemberCount(Math.max(0, community.getMemberCount() - 1));
            community.setUpdatedAt(LocalDateTime.now());
            communityRepository.save(community);
            
            return ResponseEntity.ok(Map.of("message", "Successfully left community"));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to leave community: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<?> getCommunityStats(@PathVariable Long id) {
        try {
            Optional<Community> communityOpt = communityRepository.findById(id);
            if (!communityOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            Community community = communityOpt.get();
            
            // Get all users in this community
            List<User> communityMembers = userRepository.findAll().stream()
                    .filter(user -> user.getCommunity() != null && user.getCommunity().getId().equals(id))
                    .toList();
            
            // Calculate total waste logged by community members
            double totalWasteLogged = 0;
            for (User member : communityMembers) {
                double memberWaste = wasteRepository.findByUserId(member.getId()).stream()
                        .mapToDouble(waste -> waste.getQuantity())
                        .sum();
                totalWasteLogged += memberWaste;
            }
            
            Map<String, Object> stats = Map.of(
                "memberCount", communityMembers.size(),
                "totalWasteLogged", Math.round(totalWasteLogged * 100.0) / 100.0,
                "communityName", community.getName(),
                "category", community.getCategory()
            );
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to get community stats: " + e.getMessage()));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<Community>> searchCommunities(@RequestParam String name) {
        List<Community> communities = communityRepository.findAll().stream()
                .filter(community -> community.getName().toLowerCase().contains(name.toLowerCase()))
                .toList();
        return ResponseEntity.ok(communities);
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<?> getCommunityMembers(@PathVariable Long id) {
        try {
            Optional<Community> communityOpt = communityRepository.findById(id);
            if (!communityOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Community community = communityOpt.get();
            
            // Get all users in this community
            List<User> communityMembers = userRepository.findAll().stream()
                    .filter(user -> user.getCommunity() != null && user.getCommunity().getId().equals(id))
                    .toList();

            // Create member data with basic info (excluding sensitive data like password)
            List<Map<String, Object>> memberData = communityMembers.stream().map(member -> {
                Map<String, Object> memberInfo = new HashMap<>();
                memberInfo.put("id", member.getId());
                memberInfo.put("name", member.getName());
                memberInfo.put("email", member.getEmail());
                memberInfo.put("role", member.getRole());
                memberInfo.put("joinedAt", member.getCreatedAt());
                return memberInfo;
            }).toList();

            return ResponseEntity.ok(Map.of(
                "community", community.getName(),
                "totalMembers", memberData.size(),
                "members", memberData
            ));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to get community members: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/leaderboard")
    public ResponseEntity<?> getCommunityLeaderboard(@PathVariable Long id) {
        try {
            Optional<Community> communityOpt = communityRepository.findById(id);
            if (!communityOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Community community = communityOpt.get();
            
            // Get all users in this community
            List<User> communityMembers = userRepository.findAll().stream()
                    .filter(user -> user.getCommunity() != null && user.getCommunity().getId().equals(id))
                    .toList();

            // Create leaderboard data with waste contribution
            List<Map<String, Object>> leaderboard = communityMembers.stream().map(member -> {
                double memberWaste = wasteRepository.findByUserId(member.getId()).stream()
                        .mapToDouble(waste -> waste.getQuantity())
                        .sum();
                
                long wasteEntries = wasteRepository.findByUserId(member.getId()).size();
                
                Map<String, Object> memberStats = new HashMap<>();
                memberStats.put("id", member.getId());
                memberStats.put("name", member.getName());
                memberStats.put("role", member.getRole());
                memberStats.put("totalWaste", Math.round(memberWaste * 100.0) / 100.0);
                memberStats.put("wasteEntries", wasteEntries);
                memberStats.put("joinedAt", member.getCreatedAt());
                
                return memberStats;
            })
            .sorted((a, b) -> Double.compare((Double)b.get("totalWaste"), (Double)a.get("totalWaste"))) // Sort by waste desc
            .toList();

            // Add rank to each member
            for (int i = 0; i < leaderboard.size(); i++) {
                leaderboard.get(i).put("rank", i + 1);
            }

            return ResponseEntity.ok(Map.of(
                "community", community.getName(),
                "totalMembers", leaderboard.size(),
                "leaderboard", leaderboard
            ));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to get community leaderboard: " + e.getMessage()));
        }
    }
}