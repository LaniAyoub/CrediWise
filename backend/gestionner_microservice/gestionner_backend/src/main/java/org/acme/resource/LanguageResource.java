package org.acme.resource;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.acme.entity.Language;
import org.acme.service.TranslationService;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * LanguageResource
 * REST API endpoints for language and translation management
 * 
 * Endpoints:
 * - GET /api/languages - List available languages
 * - GET /api/translations/roles - Get all roles with translations
 * - GET /api/translations/roles/{id} - Get specific role with translation
 * - GET /api/translations/screens - Get all screens with translations
 * - GET /api/translations/screens/{id} - Get specific screen with translation
 * - GET /api/translations/permissions - Get all permission types with translations
 * - GET /api/translations/permissions/{id} - Get specific permission type with translation
 * 
 * @author Backend Architecture Team
 * @version 1.0
 */
@Path("/api")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class LanguageResource {

    @Inject
    TranslationService translationService;

    // ==================== LANGUAGE ENDPOINTS ====================

    /**
     * Get all available languages
     * Supports both French and English by default
     */
    @GET
    @Path("/languages")
    @Operation(summary = "Get available languages", description = "Returns list of supported languages (en, fr)")
    @APIResponse(responseCode = "200", description = "Languages retrieved successfully")
    public Response getLanguages() {
        List<Language> languages = translationService.getAllLanguages();
        return Response.ok(languages).build();
    }

    /**
     * Get specific language by code
     */
    @GET
    @Path("/languages/{code}")
    @Operation(summary = "Get language by code", description = "Returns language details for the specified code")
    @APIResponse(responseCode = "200", description = "Language retrieved successfully")
    @APIResponse(responseCode = "404", description = "Language not found")
    public Response getLanguageByCode(
            @PathParam("code") @Parameter(description = "Language code (en, fr)", example = "en") String code) {
        Language language = translationService.getLanguageByCode(code);
        if (language == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(createErrorResponse("NOT_FOUND", "Language not found: " + code))
                    .build();
        }
        return Response.ok(language).build();
    }

    // ==================== ROLE TRANSLATION ENDPOINTS ====================

    /**
     * Get all roles with translations
     * Query param 'language' defaults to 'en' if not provided
     */
    @GET
    @Path("/translations/roles")
    @Operation(summary = "Get all roles with translations",
            description = "Returns all roles with labels and descriptions in the specified language. " +
                    "Defaults to English if language is not specified or invalid.")
    @APIResponse(responseCode = "200", description = "Roles retrieved successfully")
    public Response getAllRolesWithTranslations(
            @QueryParam("language") @Parameter(description = "Language code (en, fr)", example = "en") String language) {
        List<Map<String, Object>> roles = translationService.getAllRolesWithTranslations(language);
        return Response.ok(roles).build();
    }

    /**
     * Get specific role with translation
     */
    @GET
    @Path("/translations/roles/{id}")
    @Operation(summary = "Get role with translation",
            description = "Returns specific role with label and description in the specified language")
    @APIResponse(responseCode = "200", description = "Role retrieved successfully")
    @APIResponse(responseCode = "404", description = "Role not found")
    public Response getRoleWithTranslations(
            @PathParam("id") @Parameter(description = "Role ID", example = "1") Long roleId,
            @QueryParam("language") @Parameter(description = "Language code (en, fr)", example = "en") String language) {
        try {
            Map<String, Object> role = translationService.getRoleWithTranslations(roleId, language);
            return Response.ok(role).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(createErrorResponse("NOT_FOUND", e.getMessage()))
                    .build();
        }
    }

    // ==================== SCREEN TRANSLATION ENDPOINTS ====================

    /**
     * Get all screens with translations
     */
    @GET
    @Path("/translations/screens")
    @Operation(summary = "Get all screens with translations",
            description = "Returns all screens with labels in the specified language")
    @APIResponse(responseCode = "200", description = "Screens retrieved successfully")
    public Response getAllScreensWithTranslations(
            @QueryParam("language") @Parameter(description = "Language code (en, fr)", example = "en") String language) {
        List<Map<String, Object>> screens = translationService.getAllScreensWithTranslations(language);
        return Response.ok(screens).build();
    }

    /**
     * Get specific screen with translation
     */
    @GET
    @Path("/translations/screens/{id}")
    @Operation(summary = "Get screen with translation",
            description = "Returns specific screen with label in the specified language")
    @APIResponse(responseCode = "200", description = "Screen retrieved successfully")
    @APIResponse(responseCode = "404", description = "Screen not found")
    public Response getScreenWithTranslations(
            @PathParam("id") @Parameter(description = "Screen ID", example = "1") Long screenId,
            @QueryParam("language") @Parameter(description = "Language code (en, fr)", example = "en") String language) {
        try {
            Map<String, Object> screen = translationService.getScreenWithTranslations(screenId, language);
            return Response.ok(screen).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(createErrorResponse("NOT_FOUND", e.getMessage()))
                    .build();
        }
    }

    // ==================== PERMISSION TYPE TRANSLATION ENDPOINTS ====================

    /**
     * Get all permission types with translations
     */
    @GET
    @Path("/translations/permissions")
    @Operation(summary = "Get all permission types with translations",
            description = "Returns all permission types with labels in the specified language")
    @APIResponse(responseCode = "200", description = "Permission types retrieved successfully")
    public Response getAllPermissionTypesWithTranslations(
            @QueryParam("language") @Parameter(description = "Language code (en, fr)", example = "en") String language) {
        List<Map<String, Object>> permissions = translationService.getAllPermissionTypesWithTranslations(language);
        return Response.ok(permissions).build();
    }

    /**
     * Get specific permission type with translation
     */
    @GET
    @Path("/translations/permissions/{id}")
    @Operation(summary = "Get permission type with translation",
            description = "Returns specific permission type with label in the specified language")
    @APIResponse(responseCode = "200", description = "Permission type retrieved successfully")
    @APIResponse(responseCode = "404", description = "Permission type not found")
    public Response getPermissionTypeWithTranslations(
            @PathParam("id") @Parameter(description = "Permission type ID", example = "1") Long permissionTypeId,
            @QueryParam("language") @Parameter(description = "Language code (en, fr)", example = "en") String language) {
        try {
            Map<String, Object> permType = translationService.getPermissionTypeWithTranslations(permissionTypeId, language);
            return Response.ok(permType).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(createErrorResponse("NOT_FOUND", e.getMessage()))
                    .build();
        }
    }

    // ==================== HELPER METHODS ====================

    private Map<String, Object> createErrorResponse(String errorCode, String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("errorCode", errorCode);
        error.put("message", message);
        return error;
    }
}

