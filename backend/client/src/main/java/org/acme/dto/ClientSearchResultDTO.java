package org.acme.dto;

/**
 * Lightweight DTO returned by the smart-search endpoint.
 * Intentionally minimal — only the fields needed to render a search dropdown row.
 * No gRPC enrichment is performed, keeping the endpoint fast and stateless.
 */
public record ClientSearchResultDTO(
        String id,
        String clientType,
        String status,
        String firstName,
        String lastName,
        String companyName,
        String nationalId,
        String primaryPhone,
        String email,
        String cbsId,
        String agenceId
) {}
