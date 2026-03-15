package com.ecotrack;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Accuracy test for the AI Waste Classifier endpoint.
 *
 * Prerequisites:
 *   - The backend server must be running on localhost:8080
 *   - Fill in TEST_EMAIL and TEST_PASSWORD below with valid credentials
 *
 * Run with:
 *   cd backend
 *   ./mvnw test -Dtest=WasteClassifierAccuracyTest -Dsurefire.failIfNoSpecifiedTests=false
 *
 * The accuracy report is printed to console and saved to accuracy_report.txt
 * in the backend/ directory.
 */
class WasteClassifierAccuracyTest {

    // ── Configuration — fill these in before running ──────────────────────────
    private static final String BASE_URL      = "http://localhost:8080/api";
    private static final String TEST_EMAIL    = "test@ecotrack.com";     // e.g. "test@ecotrack.com"
    private static final String TEST_PASSWORD = "test@123";  // matching password

    /** Pause between AI calls to respect Groq rate limits (milliseconds). */
    private static final int DELAY_MS = 2000;
    /** Minimum bytes for a response to be treated as a valid image payload. */
    private static final int MIN_IMAGE_BYTES = 1000;

    /**
     * Test cases: { display label, direct image URL, expected category }
     * Expected category must be either "E-waste" or "Food".
     */
    private static final String[][] TEST_CASES = {
        // ── E-waste ──────────────────────────────────────────────────────────
        { "smartphone",        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Apple_iPhone_SE_(3rd_generation).jpg/220px-Apple_iPhone_SE_(3rd_generation).jpg", "E-waste" },
        { "broken_laptop",     "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Laptop_hard_drive_exposed.jpg/320px-Laptop_hard_drive_exposed.jpg", "E-waste" },
        { "old_charger",       "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/USB_cables.jpg/320px-USB_cables.jpg", "E-waste" },
        { "dead_battery",      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/9-volt-battery.jpg/220px-9-volt-battery.jpg", "E-waste" },
        { "keyboard",          "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Keyboard_lights.jpg/320px-Keyboard_lights.jpg", "E-waste" },
        { "earphones",         "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Apple_EarPods.jpg/220px-Apple_EarPods.jpg", "E-waste" },
        { "old_monitor",       "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/CRT_color_monitor.jpg/320px-CRT_color_monitor.jpg", "E-waste" },
        // ── Food ─────────────────────────────────────────────────────────────
        { "fresh_fruits",      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Hapus_Mango.jpg/320px-Hapus_Mango.jpg", "Food" },
        { "fresh_bread",       "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Fresh_made_bread_05.jpg/320px-Fresh_made_bread_05.jpg", "Food" },
        { "cooked_food",       "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/320px-Good_Food_Display_-_NCI_Visuals_Online.jpg", "Food" },
        { "leftover_meal",     "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/320px-Good_Food_Display_-_NCI_Visuals_Online.jpg", "Food" },
        { "packaged_food",     "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Supermarkt.jpg/320px-Supermarkt.jpg", "Food" },
        { "rotten_vegetables", "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Rotten_Apple.jpg/220px-Rotten_Apple.jpg", "Food" },
        { "spoiled_fruit",     "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Rotten_Apple.jpg/220px-Rotten_Apple.jpg", "Food" },
        { "food_waste",        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Food_waste.jpg/320px-Food_waste.jpg", "Food" },
    };

    // ── Entry point ───────────────────────────────────────────────────────────

    @Test
    void runAccuracyTest() throws Exception {
        System.out.println("\n>> Logging in as " + TEST_EMAIL + " …");
        LoginResult login = loginAndGetToken();
        System.out.println(">> Login successful — userId=" + login.userId + "\n");

        RestTemplate rest = new RestTemplate();
        List<Row> rows = new ArrayList<>();

        for (String[] tc : TEST_CASES) {
            String label    = tc[0];
            String imageUrl = tc[1];
            String expected = tc[2];

            System.out.printf("  Testing %-24s ", label + ".jpg");

            // 1. Download image
            byte[] imageBytes = downloadImage(imageUrl);
            if (imageBytes == null) {
                System.out.println("→ SKIPPED (download failed)");
                rows.add(new Row(label + ".jpg", expected, "N/A", "—", Status.SKIP));
                continue;
            }
            String base64 = Base64.getEncoder().encodeToString(imageBytes);

            // 2. Call classify endpoint
            try {
                JsonObject response = callClassify(rest, login.token, login.userId, base64);

                String gotRaw  = response.has("predictedCategory")
                    ? response.get("predictedCategory").getAsString() : "Unknown";
                String got     = normaliseCategory(gotRaw);
                int    score   = response.has("confidenceScore")
                    ? response.get("confidenceScore").getAsInt() : 0;
                boolean pass   = expected.equalsIgnoreCase(got);

                System.out.printf("→ %s  expected=%-7s got=%-7s confidence=%d%%%n",
                    pass ? "✅" : "❌", expected, got, score);

                rows.add(new Row(label + ".jpg", expected, got, score + "%",
                    pass ? Status.PASS : Status.FAIL));

            } catch (HttpStatusCodeException ex) {
                String msg = ex.getStatusCode() + " " + ex.getStatusText();
                System.out.println("→ ❌ HTTP error: " + msg);
                rows.add(new Row(label + ".jpg", expected, "ERROR(" + ex.getStatusCode() + ")", "—", Status.FAIL));
            } catch (Exception ex) {
                System.out.println("→ ❌ Error: " + ex.getMessage());
                rows.add(new Row(label + ".jpg", expected, "ERROR", "—", Status.FAIL));
            }

            // 3. Pause between calls to avoid Groq rate-limit
            Thread.sleep(DELAY_MS);
        }

        // 4. Build and output report
        String report = buildReport(rows);
        System.out.println(report);

        Path out = Path.of("accuracy_report.txt");
        Files.writeString(out, report);
        System.out.println(">> Report saved to: " + out.toAbsolutePath());
    }

    // ── HTTP helpers ──────────────────────────────────────────────────────────

    private LoginResult loginAndGetToken() {
        RestTemplate rest = new RestTemplate();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Try login first
        try {
            return doLogin(rest, headers);
        } catch (HttpStatusCodeException ex) {
            if (ex.getStatusCode().value() != 401 && ex.getStatusCode().value() != 404) {
                throw new IllegalStateException(
                    "Login failed (" + ex.getStatusCode() + "). " +
                    "Ensure the backend server is running on " + BASE_URL
                );
            }
        }

        // 401/404 → account doesn't exist yet → auto-register then login
        System.out.println(">> Account not found — registering test account automatically …");
        try {
            Map<String, Object> signupBody = Map.of(
                "email", TEST_EMAIL,
                "password", TEST_PASSWORD,
                "name", "Accuracy Test User",
                "phoneNumber", "0000000000",
                "role", "DONOR",
                "latitude", 0.0,
                "longitude", 0.0
            );
            rest.postForEntity(
                BASE_URL + "/users/signup",
                new HttpEntity<>(new Gson().toJson(signupBody), headers),
                String.class
            );
            System.out.println(">> Registration successful — logging in …");
        } catch (HttpStatusCodeException signupEx) {
            // 400 "email already exists" → race condition, just proceed to login
            if (signupEx.getStatusCode().value() != 400) {
                throw new IllegalStateException("Auto-registration failed: " + signupEx.getMessage());
            }
        }

        // Retry login after registration
        try {
            return doLogin(rest, headers);
        } catch (HttpStatusCodeException ex) {
            throw new IllegalStateException(
                "Login failed after auto-registration (" + ex.getStatusCode() + "). " +
                "Server response: " + ex.getResponseBodyAsString()
            );
        }
    }

    private LoginResult doLogin(RestTemplate rest, HttpHeaders headers) {
        Map<String, String> body = Map.of("email", TEST_EMAIL, "password", TEST_PASSWORD);
        ResponseEntity<String> resp = rest.postForEntity(
            BASE_URL + "/users/login",
            new HttpEntity<>(new Gson().toJson(body), headers),
            String.class
        );
        JsonObject obj = JsonParser.parseString(resp.getBody()).getAsJsonObject();
        String token  = obj.get("token").getAsString();
        long   userId = obj.get("id").getAsLong();
        return new LoginResult(token, userId);
    }

    private JsonObject callClassify(RestTemplate rest, String token, long userId, String base64) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        Map<String, Object> body = Map.of("userId", userId, "imageBase64", base64);
        String json = new Gson().toJson(body);

        ResponseEntity<String> resp = rest.postForEntity(
            BASE_URL + "/waste/classify",
            new HttpEntity<>(json, headers),
            String.class
        );
        return JsonParser.parseString(resp.getBody()).getAsJsonObject();
    }

    /** Downloads one image from a direct public URL. */
    private byte[] downloadImage(String imageUrl) {
        byte[] bytes = fetchUrl(imageUrl);
        if (bytes != null && bytes.length >= MIN_IMAGE_BYTES) return bytes;
        return null;
    }

    private byte[] fetchUrl(String urlStr) {
        String currentUrl = urlStr;
        int maxAttempts = 4;

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                HttpURLConnection conn = openConn(currentUrl);

                // Follow up to 5 redirects manually
                int redirects = 0;
                while (redirects < 5) {
                    int status = conn.getResponseCode();
                    if (status == HttpURLConnection.HTTP_MOVED_PERM
                     || status == HttpURLConnection.HTTP_MOVED_TEMP
                     || status == 307 || status == 308) {
                        String location = conn.getHeaderField("Location");
                        if (location == null || location.isBlank()) break;
                        URL next = new URL(new URL(currentUrl), location);
                        conn.disconnect();
                        currentUrl = next.toString();
                        conn = openConn(currentUrl);
                        redirects++;
                    } else {
                        break;
                    }
                }

                int status = conn.getResponseCode();
                if (status == 200) {
                    try (InputStream is = conn.getInputStream()) {
                        return is.readAllBytes();
                    }
                }

                if (status == 429 && attempt < maxAttempts) {
                    String retryAfter = conn.getHeaderField("Retry-After");
                    long waitMs = 10_000;
                    try {
                        if (retryAfter != null) {
                            waitMs = Math.max(1_000, Long.parseLong(retryAfter.trim()) * 1000L);
                        }
                    } catch (Exception ignored) {
                        waitMs = 10_000;
                    }
                    Thread.sleep(waitMs);
                    continue;
                }

                return null;
            } catch (Exception e) {
                if (attempt == maxAttempts) {
                    return null;
                }
            }
        }

        return null;
    }

    private HttpURLConnection openConn(String urlStr) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(urlStr).openConnection();
        conn.setInstanceFollowRedirects(false); // we handle redirects manually above
        conn.setConnectTimeout(10_000);
        conn.setReadTimeout(20_000);
        conn.setRequestProperty("User-Agent", "EcoTrack-AccuracyTest/1.0");
        return conn;
    }

    // ── Normalisation ─────────────────────────────────────────────────────────

    /** Reduces whatever the model returns to "E-waste" or "Food" (or "Unknown"). */
    private String normaliseCategory(String raw) {
        if (raw == null) return "Unknown";
        String lower = raw.toLowerCase();
        if (lower.contains("e-waste") || lower.contains("ewaste")
         || lower.contains("electronic") || lower.equals("e_waste")) {
            return "E-waste";
        }
        if (lower.contains("food") || lower.contains("organic")
         || lower.contains("vegetable") || lower.contains("fruit")) {
            return "Food";
        }
        return raw; // Return as-is so the mismatch is visible
    }

    // ── Report builder ────────────────────────────────────────────────────────

    private String buildReport(List<Row> rows) {
        final int COL_IMAGE    = 26;
        final int COL_EXPECTED = 10;
        final int COL_GOT      = 10;
        final int COL_SCORE    = 8;

        String sep  = "=".repeat(72);
        String dash = "-".repeat(72);

        StringBuilder sb = new StringBuilder();
        sb.append(sep).append("\n");
        sb.append("WASTE CLASSIFIER ACCURACY REPORT\n");
        sb.append("Generated: ").append(
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
        ).append("\n");
        sb.append("Server:    ").append(BASE_URL).append("\n");
        sb.append(sep).append("\n");

        // Header
        sb.append(String.format(
            "%-" + COL_IMAGE + "s %-" + COL_EXPECTED + "s %-" + COL_GOT + "s %-" + COL_SCORE + "s %s%n",
            "Image", "Expected", "Got", "Score", "Pass"
        ));
        sb.append(dash).append("\n");

        // Rows
        int total = 0, correct = 0, skipped = 0;
        for (Row r : rows) {
            sb.append(String.format(
                "%-" + COL_IMAGE + "s %-" + COL_EXPECTED + "s %-" + COL_GOT + "s %-" + COL_SCORE + "s %s%n",
                r.image, r.expected, r.got, r.score, r.status.symbol
            ));
            switch (r.status) {
                case PASS -> { total++; correct++; }
                case FAIL -> total++;
                case SKIP -> skipped++;
            }
        }

        // Summary
        sb.append(dash).append("\n");
        double pct = total > 0 ? (correct * 100.0 / total) : 0.0;
        sb.append(String.format(
            "Total: %d | Correct: %d | Skipped: %d | Accuracy: %.1f%%%n",
            total, correct, skipped, pct
        ));
        sb.append(sep).append("\n");

        return sb.toString();
    }

    // ── Data classes ──────────────────────────────────────────────────────────

    private enum Status {
        PASS("✅"), FAIL("❌"), SKIP("⏭");
        final String symbol;
        Status(String symbol) { this.symbol = symbol; }
    }

    private record Row(String image, String expected, String got, String score, Status status) {}

    private record LoginResult(String token, long userId) {}
}
