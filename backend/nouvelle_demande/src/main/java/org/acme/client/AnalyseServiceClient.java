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
 * HTTP client to communicate with the analyse service.
 * JWT is injected directly — callers must not pass raw Authorization headers.
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
     * @param demandeId       ID of the demande
     * @param clientId        UUID of the client
     * @param demandeStatus   Status of the demande
     * @param demandeCreatedAt ISO8601 creation date of the demande
     * @return dossierId of the created dossier
     * @throws BadRequestException if dossier creation fails
     */
    public Long createDossier(Long demandeId, String clientId, String demandeStatus, String demandeCreatedAt) {
        try {
            StringBuilder urlBuilder = new StringBuilder(analyseServiceUrl)
                    .append("/analyses/dossiers?demandeId=").append(demandeId)
                    .append("&clientId=").append(URLEncoder.encode(clientId, StandardCharsets.UTF_8));

            if (demandeStatus != null && !demandeStatus.isBlank()) {
                urlBuilder.append("&demandeStatus=").append(URLEncoder.encode(demandeStatus, StandardCharsets.UTF_8));
            }
            if (demandeCreatedAt != null && !demandeCreatedAt.isBlank()) {
                urlBuilder.append("&demandeCreatedAt=").append(URLEncoder.encode(demandeCreatedAt, StandardCharsets.UTF_8));
            }

            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(new URI(urlBuilder.toString()))
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(10));

            String rawToken = jwt.getRawToken();
            if (rawToken != null && !rawToken.isBlank()) {
                requestBuilder.header("Authorization", "Bearer " + rawToken);
            }

            HttpResponse<String> response = httpClient.send(requestBuilder.build(),
                    HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 201 && response.statusCode() != 200) {
                Log.errorf("Analyse service returned status %d for demande %d", response.statusCode(), demandeId);
                throw new BadRequestException("Failed to create dossier: " + response.statusCode());
            }

            JsonNode json = mapper.readTree(response.body());
            Long dossierId = json.get("id").asLong();
            Log.infof("Analysis dossier created: dossierId=%d demandeId=%d sub=%s",
                    dossierId, demandeId, jwt.getSubject());
            return dossierId;

        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            Log.errorf("Failed to create analysis dossier for demande %d: %s", demandeId, e.getMessage());
            throw new BadRequestException("Failed to create analysis dossier: " + e.getMessage());
        }
    }
}
