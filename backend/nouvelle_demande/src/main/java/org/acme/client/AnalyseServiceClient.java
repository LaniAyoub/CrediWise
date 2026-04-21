package org.acme.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.logging.Log;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * HTTP client to communicate with analyse service.
 * Creates analysis dossiers via REST API.
 */
@ApplicationScoped
public class AnalyseServiceClient {

    @ConfigProperty(name = "analyse.service.url", defaultValue = "http://localhost:8084")
    String analyseServiceUrl;

    @Inject
    JsonWebToken jwt;

    private static final ObjectMapper mapper = new ObjectMapper();
    private static final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    /**
     * Create an analysis dossier for a demande (atomic with status update).
     *
     * @param demandeId ID of the demande
     * @param clientId UUID of the client
     * @param demandeStatus Status of the demande
     * @param demandeCreatedAt ISO8601 creation date of the demande
     * @param authorizationHeader JWT authorization header from current request
     * @return dossierId of the created dossier
     * @throws BadRequestException if dossier creation fails
     */
    public Long createDossier(Long demandeId, String clientId, String demandeStatus, String demandeCreatedAt, String authorizationHeader) {
        try {
            // Build URL with query parameters
            StringBuilder urlBuilder = new StringBuilder(analyseServiceUrl)
                    .append("/analyses/dossiers?demandeId=").append(demandeId)
                    .append("&clientId=").append(URLEncoder.encode(clientId, StandardCharsets.UTF_8));

            if (demandeStatus != null && !demandeStatus.isBlank()) {
                urlBuilder.append("&demandeStatus=").append(URLEncoder.encode(demandeStatus, StandardCharsets.UTF_8));
            }

            if (demandeCreatedAt != null && !demandeCreatedAt.isBlank()) {
                urlBuilder.append("&demandeCreatedAt=").append(URLEncoder.encode(demandeCreatedAt, StandardCharsets.UTF_8));
            }

            // Build request with authentication
            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(new URI(urlBuilder.toString()))
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(10));

            // Add authorization header if available
            if (authorizationHeader != null && !authorizationHeader.isBlank()) {
                requestBuilder.header("Authorization", authorizationHeader);
            }

            HttpRequest request = requestBuilder.build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 201 && response.statusCode() != 200) {
                Log.error("Analyse service returned status " + response.statusCode() + ": " + response.body());
                throw new BadRequestException("Failed to create dossier: " + response.statusCode());
            }

            // Parse response to get dossier ID
            JsonNode json = mapper.readTree(response.body());
            Long dossierId = json.get("id").asLong();

            Log.info("Analysis dossier created: " + dossierId + " for demande " + demandeId);
            return dossierId;
        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            Log.error("Failed to create analysis dossier for demande " + demandeId + ": " + e.getMessage());
            throw new BadRequestException("Failed to create analysis dossier: " + e.getMessage());
        }
    }
}
