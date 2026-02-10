package com.ecotrack.backend.service;
import com.ecotrack.backend.model.Facility;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class FacilityMatchingService {

    public Facility findNearestFacility(
            String wasteType, 
            double userLat, 
            double userLng, 
            List<Facility> facilities) {

        Facility nearest = null;
        double minDistance = Double.MAX_VALUE;

        for (Facility f : facilities) {
            if (!f.getType().equalsIgnoreCase(wasteType)) continue;

            double distance = haversine(userLat, userLng, f.getLatitude(), f.getLongitude());
            if (distance < minDistance) {
                minDistance = distance;
                nearest = f;
            }
        }

        return nearest;
    }

    // Haversine formula
    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                 + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                 * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}

