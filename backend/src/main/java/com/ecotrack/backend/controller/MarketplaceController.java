package com.ecotrack.backend.controller;

import com.ecotrack.backend.model.MarketplaceItem;
import com.ecotrack.backend.model.User;
import com.ecotrack.backend.repository.MarketplaceItemRepository;
import com.ecotrack.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/marketplace")
public class MarketplaceController {

    @Autowired
    private MarketplaceItemRepository marketplaceItemRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<MarketplaceItem> getAllAvailable() {
        return marketplaceItemRepository.findByStatus("AVAILABLE");
    }

    @GetMapping("/category/{category}")
    public List<MarketplaceItem> getByCategory(@PathVariable String category) {
        return marketplaceItemRepository.findByCategory(category);
    }

    @GetMapping("/seller/{sellerId}")
    public List<MarketplaceItem> getBySeller(@PathVariable Long sellerId) {
        return marketplaceItemRepository.findBySellerId(sellerId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MarketplaceItem> getById(@PathVariable Long id) {
        return marketplaceItemRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createListing(@RequestBody Map<String, Object> body) {
        try {
            Long sellerId = Long.valueOf(body.get("sellerId").toString());
            Optional<User> sellerOpt = userRepository.findById(sellerId);
            if (sellerOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Seller not found"));
            }

            MarketplaceItem item = new MarketplaceItem();
            item.setSeller(sellerOpt.get());
            item.setTitle(body.get("title").toString());
            item.setDescription(body.get("description").toString());
            item.setCategory(body.getOrDefault("category", "OTHER").toString());
            item.setCondition(body.getOrDefault("condition", "GOOD").toString());
            item.setFree(Boolean.parseBoolean(body.getOrDefault("isFree", "false").toString()));
            item.setPrice(Double.parseDouble(body.getOrDefault("price", "0").toString()));
            item.setCurrency("INR");
            item.setStatus("AVAILABLE");
            if (body.containsKey("imageUrl")) {
                item.setImageUrl(body.get("imageUrl").toString());
            }
            item.setCreatedAt(LocalDateTime.now());
            item.setUpdatedAt(LocalDateTime.now());

            MarketplaceItem saved = marketplaceItemRepository.save(item);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to create listing: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateListing(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return marketplaceItemRepository.findById(id).map(item -> {
            if (body.containsKey("title")) item.setTitle(body.get("title").toString());
            if (body.containsKey("description")) item.setDescription(body.get("description").toString());
            if (body.containsKey("status")) item.setStatus(body.get("status").toString());
            if (body.containsKey("price")) item.setPrice(Double.parseDouble(body.get("price").toString()));
            if (body.containsKey("isFree")) item.setFree(Boolean.parseBoolean(body.get("isFree").toString()));
            if (body.containsKey("condition")) item.setCondition(body.get("condition").toString());
            if (body.containsKey("imageUrl")) item.setImageUrl(body.get("imageUrl").toString());
            item.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(marketplaceItemRepository.save(item));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteListing(@PathVariable Long id) {
        if (marketplaceItemRepository.existsById(id)) {
            marketplaceItemRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
