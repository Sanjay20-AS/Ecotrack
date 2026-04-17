package com.ecotrack.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.ecotrack.backend.model.Waste;
import com.ecotrack.backend.repository.WasteRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/geocode")
public class GeocodeController {

    @Value("${geoapify.api.key:}")
    private String geoapifyKey;

    private final RestTemplate rest = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    private final WasteRepository wasteRepository;

    public GeocodeController(WasteRepository wasteRepository) {
        this.wasteRepository = wasteRepository;
    }

    @GetMapping
    public ResponseEntity<String> geocode(@RequestParam(name = "address") String address) {
        try {
            if (geoapifyKey == null || geoapifyKey.isBlank()) {
                // No key configured — return empty results to frontend
                return ResponseEntity.status(502).contentType(MediaType.APPLICATION_JSON).body("[]");
            }
            String url = "https://api.geoapify.com/v1/geocode/search?text=" + java.net.URLEncoder.encode(address, "UTF-8") + "&apiKey=" + java.net.URLEncoder.encode(geoapifyKey, "UTF-8") + "&limit=1&lang=en";
            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE);
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<String> resp = rest.exchange(url, HttpMethod.GET, entity, String.class);
            // Return the Geoapify response body directly
            return ResponseEntity.status(resp.getStatusCode()).contentType(MediaType.APPLICATION_JSON).body(resp.getBody());
        } catch (RestClientException | java.io.UnsupportedEncodingException ex) {
            return ResponseEntity.status(502).contentType(MediaType.APPLICATION_JSON).body("[]");
        }
    }

    @PostMapping("/regeocode")
    public ResponseEntity<?> regeocodeWaste(@RequestParam(name = "ids") String ids) {
        String[] parts = ids.split(",");
        List<Waste> updated = new ArrayList<>();
        for (String p : parts) {
            try {
                Long id = Long.parseLong(p.trim());
                var opt = wasteRepository.findById(id);
                if (opt.isPresent()) {
                    Waste w = opt.get();
                    String addr = w.getLocationAddress();
                    if (addr == null || addr.isBlank()) continue;
                    // call Geoapify
                    try {
                        String url = "https://api.geoapify.com/v1/geocode/search?text=" + java.net.URLEncoder.encode(addr, "UTF-8") + "&apiKey=" + java.net.URLEncoder.encode(geoapifyKey, "UTF-8") + "&limit=1&lang=en";
                        HttpHeaders headers = new HttpHeaders();
                        headers.set(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE);
                        HttpEntity<Void> entity = new HttpEntity<>(headers);
                        ResponseEntity<String> resp = rest.exchange(url, HttpMethod.GET, entity, String.class);
                        if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                            try {
                                JsonNode root = mapper.readTree(resp.getBody());
                                JsonNode results = root.path("results");
                                if (results.isArray() && results.size() > 0) {
                                    JsonNode prop = results.get(0).path("properties");
                                    double lat = prop.path("lat").asDouble(Double.NaN);
                                    double lon = prop.path("lon").asDouble(Double.NaN);
                                    if (!Double.isNaN(lat) && !Double.isNaN(lon)) {
                                        w.setLocationLatitude(lat);
                                        w.setLocationLongitude(lon);
                                        wasteRepository.save(w);
                                        updated.add(w);
                                    }
                                }
                            } catch (Exception ex) {
                                // ignore parse errors per-item
                            }
                        }
                    } catch (java.io.UnsupportedEncodingException ex) {
                        // handle encoding error
                        continue;
                    }
                }
            } catch (NumberFormatException nfe) {
                // skip invalid id
            }
        }
        return ResponseEntity.ok(updated);
    }
}
