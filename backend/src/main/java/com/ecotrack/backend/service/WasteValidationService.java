package com.ecotrack.backend.service;

import com.ecotrack.backend.dto.WasteCreateRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
public class WasteValidationService {

    private static final List<String> ALLOWED_WASTE_TYPES = Arrays.asList("FOOD", "E-WASTE");
    private static final double MIN_QUANTITY = 0.1;
    private static final double MAX_QUANTITY = 1000.0;
    private static final List<String> ALLOWED_STATUSES = Arrays.asList("PENDING", "IN_PROGRESS", "COLLECTED");

    public List<String> validateWasteRequest(WasteCreateRequest request) {
        List<String> errors = new ArrayList<>();

        // Validate user ID
        if (request.getUserId() == null || request.getUserId() <= 0) {
            errors.add("Valid user ID is required");
        }

        // Validate waste type (CRITICAL - makes invalid entries impossible)
        if (request.getType() == null || request.getType().trim().isEmpty()) {
            errors.add("Waste type is required");
        } else {
            String type = request.getType().trim().toUpperCase();
            if (!ALLOWED_WASTE_TYPES.contains(type)) {
                errors.add("Invalid waste type. Allowed types: " + ALLOWED_WASTE_TYPES);
            }
        }

        // Validate quantity
        if (request.getQuantity() <= 0) {
            errors.add("Quantity must be greater than 0");
        } else if (request.getQuantity() < MIN_QUANTITY) {
            errors.add("Minimum quantity is " + MIN_QUANTITY + " kg");
        } else if (request.getQuantity() > MAX_QUANTITY) {
            errors.add("Maximum quantity is " + MAX_QUANTITY + " kg");
        }

        // Validate description - must be meaningful
        if (request.getDescription() == null || request.getDescription().trim().length() < 3) {
            errors.add("Description must be at least 3 characters long");
        } else if (request.getDescription().trim().length() > 500) {
            errors.add("Description cannot exceed 500 characters");
        }

        // Validate coordinates (if provided)
        if (request.getLocationLatitude() < -90 || request.getLocationLatitude() > 90) {
            errors.add("Invalid latitude. Must be between -90 and 90");
        }
        if (request.getLocationLongitude() < -180 || request.getLocationLongitude() > 180) {
            errors.add("Invalid longitude. Must be between -180 and 180");
        }

        // Validate status (if provided)
        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            String status = request.getStatus().trim().toUpperCase();
            if (!ALLOWED_STATUSES.contains(status)) {
                errors.add("Invalid status. Allowed statuses: " + ALLOWED_STATUSES);
            }
        }

        // Validate image URL format (if provided)
        if (request.getImageUrl() != null && !request.getImageUrl().trim().isEmpty()) {
            String imageUrl = request.getImageUrl().trim();
            if (!isValidImageUrl(imageUrl)) {
                errors.add("Invalid image URL format");
            }
        }

        return errors;
    }

    private boolean isValidImageUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return true; // Optional field
        }
        
        // Basic URL format validation
        if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("/")) {
            return false;
        }
        
        // Must end with image extension
        String lowerUrl = url.toLowerCase();
        return lowerUrl.endsWith(".jpg") || lowerUrl.endsWith(".jpeg") || 
               lowerUrl.endsWith(".png") || lowerUrl.endsWith(".gif") ||
               lowerUrl.endsWith(".webp") || lowerUrl.endsWith(".bmp");
    }

    public boolean isValidWasteType(String type) {
        return type != null && ALLOWED_WASTE_TYPES.contains(type.trim().toUpperCase());
    }

    public boolean isValidQuantity(double quantity) {
        return quantity >= MIN_QUANTITY && quantity <= MAX_QUANTITY;
    }
}