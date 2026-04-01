package org.acme.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.transaction.Transactional;
import org.acme.entity.*;
import org.jboss.logging.Logger;

import java.util.*;

/**
 * TranslationService
 * Handles multi-language support for the application
 * 
 * Responsibilities:
 * - Retrieve translated content based on language preference
 * - Manage language data
 * - Handle fallback to default language (English)
 * 
 * @author Backend Architecture Team
 * @version 1.0
 */
@ApplicationScoped
public class TranslationService {

    private static final Logger logger = Logger.getLogger(TranslationService.class);
    private static final String DEFAULT_LANGUAGE = "en";

    @Inject
    EntityManager em;

    /**
     * Get all available languages
     */
    public List<Language> getAllLanguages() {
        logger.debug("Fetching all languages");
        return Language.listAll();
    }

    /**
     * Get language by code
     */
    public Language getLanguageByCode(String code) {
        String normalizedCode = code != null ? code.toLowerCase().trim() : DEFAULT_LANGUAGE;
        try {
            return Language.find("code", normalizedCode).firstResult();
        } catch (NoResultException e) {
            logger.warnf("Language not found: %s. Using default: %s", code, DEFAULT_LANGUAGE);
            return Language.find("code", DEFAULT_LANGUAGE).firstResult();
        }
    }

    /**
     * Get role with translations for a specific language
     * Falls back to English if translation not found
     */
    public Map<String, Object> getRoleWithTranslations(Long roleId, String languageCode) {
        String language = getValidLanguageCode(languageCode);
        logger.infof("Fetching role %d translations for language: %s", roleId, language);

        try {
            String query = "SELECT r.code, rt.label, rt.description, r.isActive " +
                          "FROM RoleTranslation rt " +
                          "JOIN rt.role r " +
                          "JOIN rt.language l " +
                          "WHERE r.id = :roleId AND l.code = :language";
            
            Object[] result = (Object[]) em.createQuery(query)
                                           .setParameter("roleId", roleId)
                                           .setParameter("language", language)
                                           .getSingleResult();

            return buildRoleResponse(result);
        } catch (NoResultException e) {
            // Fallback to default language
            if (!language.equals(DEFAULT_LANGUAGE)) {
                logger.infof("Translation not found for %s, falling back to %s", language, DEFAULT_LANGUAGE);
                return getRoleWithTranslations(roleId, DEFAULT_LANGUAGE);
            }
            logger.warnf("No translation found for role %d in any language", roleId);
            throw new IllegalArgumentException("Role not found: " + roleId);
        }
    }

    /**
     * Get all roles with translations for a specific language
     */
    public List<Map<String, Object>> getAllRolesWithTranslations(String languageCode) {
        String language = getValidLanguageCode(languageCode);
        logger.infof("Fetching all roles with translations for language: %s", language);

        String query = "SELECT r.id, r.code, rt.label, rt.description, r.isActive " +
                      "FROM RoleTranslation rt " +
                      "JOIN rt.role r " +
                      "JOIN rt.language l " +
                      "WHERE l.code = :language AND r.isActive = TRUE " +
                      "ORDER BY r.code";
        
        @SuppressWarnings("unchecked")
        List<Object[]> results = em.createQuery(query)
                                   .setParameter("language", language)
                                   .getResultList();

        return convertToRoleResponseList(results);
    }

    /**
     * Get screen with translation
     */
    public Map<String, Object> getScreenWithTranslations(Long screenId, String languageCode) {
        String language = getValidLanguageCode(languageCode);
        logger.infof("Fetching screen %d translation for language: %s", screenId, language);

        try {
            String query = "SELECT s.code, st.label " +
                          "FROM ScreenTranslation st " +
                          "JOIN st.screen s " +
                          "JOIN st.language l " +
                          "WHERE s.id = :screenId AND l.code = :language";
            
            Object[] result = (Object[]) em.createQuery(query)
                                           .setParameter("screenId", screenId)
                                           .setParameter("language", language)
                                           .getSingleResult();

            Map<String, Object> response = new HashMap<>();
            response.put("code", result[0]);
            response.put("label", result[1]);
            return response;
        } catch (NoResultException e) {
            if (!language.equals(DEFAULT_LANGUAGE)) {
                return getScreenWithTranslations(screenId, DEFAULT_LANGUAGE);
            }
            throw new IllegalArgumentException("Screen not found: " + screenId);
        }
    }

    /**
     * Get all screens with translations
     */
    public List<Map<String, Object>> getAllScreensWithTranslations(String languageCode) {
        String language = getValidLanguageCode(languageCode);
        logger.infof("Fetching all screens with translations for language: %s", language);

        String query = "SELECT s.id, s.code, st.label " +
                      "FROM ScreenTranslation st " +
                      "JOIN st.screen s " +
                      "JOIN st.language l " +
                      "WHERE l.code = :language " +
                      "ORDER BY s.code";
        
        @SuppressWarnings("unchecked")
        List<Object[]> results = em.createQuery(query)
                                   .setParameter("language", language)
                                   .getResultList();

        List<Map<String, Object>> screens = new ArrayList<>();
        for (Object[] row : results) {
            Map<String, Object> screen = new HashMap<>();
            screen.put("id", row[0]);
            screen.put("code", row[1]);
            screen.put("label", row[2]);
            screens.add(screen);
        }
        return screens;
    }

    /**
     * Get permission type with translation
     */
    public Map<String, Object> getPermissionTypeWithTranslations(Long permissionTypeId, String languageCode) {
        String language = getValidLanguageCode(languageCode);
        logger.infof("Fetching permission type %d translation for language: %s", permissionTypeId, language);

        try {
            String query = "SELECT pt.code, ptt.label " +
                          "FROM PermissionTypeTranslation ptt " +
                          "JOIN ptt.permissionType pt " +
                          "JOIN ptt.language l " +
                          "WHERE pt.id = :permTypeId AND l.code = :language";
            
            Object[] result = (Object[]) em.createQuery(query)
                                           .setParameter("permTypeId", permissionTypeId)
                                           .setParameter("language", language)
                                           .getSingleResult();

            Map<String, Object> response = new HashMap<>();
            response.put("code", result[0]);
            response.put("label", result[1]);
            return response;
        } catch (NoResultException e) {
            if (!language.equals(DEFAULT_LANGUAGE)) {
                return getPermissionTypeWithTranslations(permissionTypeId, DEFAULT_LANGUAGE);
            }
            throw new IllegalArgumentException("Permission type not found: " + permissionTypeId);
        }
    }

    /**
     * Get all permission types with translations
     */
    public List<Map<String, Object>> getAllPermissionTypesWithTranslations(String languageCode) {
        String language = getValidLanguageCode(languageCode);
        logger.infof("Fetching all permission types with translations for language: %s", language);

        String query = "SELECT pt.id, pt.code, ptt.label " +
                      "FROM PermissionTypeTranslation ptt " +
                      "JOIN ptt.permissionType pt " +
                      "JOIN ptt.language l " +
                      "WHERE l.code = :language " +
                      "ORDER BY pt.code";
        
        @SuppressWarnings("unchecked")
        List<Object[]> results = em.createQuery(query)
                                   .setParameter("language", language)
                                   .getResultList();

        List<Map<String, Object>> permTypes = new ArrayList<>();
        for (Object[] row : results) {
            Map<String, Object> permType = new HashMap<>();
            permType.put("id", row[0]);
            permType.put("code", row[1]);
            permType.put("label", row[2]);
            permTypes.add(permType);
        }
        return permTypes;
    }

    /**
     * Create/Update role translations
     */
    @Transactional
    public void saveRoleTranslation(Long roleId, String languageCode, String label, String description) {
        Role role = Role.findById(roleId);
        if (role == null) {
            throw new IllegalArgumentException("Role not found: " + roleId);
        }

        Language language = getLanguageByCode(languageCode);
        
        RoleTranslation translation = RoleTranslation.find("role_id = ?1 and language_id = ?2", roleId, language.id)
                                                      .firstResult();
        
        if (translation == null) {
            translation = new RoleTranslation(role, language, label, description);
        } else {
            translation.setLabel(label);
            translation.setDescription(description);
        }
        
        translation.persist();
        logger.infof("Saved translation for role %d in language %s", roleId, languageCode);
    }

    // ======= Helper Methods =======

    private String getValidLanguageCode(String languageCode) {
        if (languageCode == null || languageCode.trim().isEmpty()) {
            return DEFAULT_LANGUAGE;
        }
        String normalized = languageCode.toLowerCase().trim();
        // Validate that language exists
        try {
            Language.find("code", normalized).firstResult();
            return normalized;
        } catch (NoResultException e) {
            logger.warnf("Invalid language code: %s. Using default: %s", languageCode, DEFAULT_LANGUAGE);
            return DEFAULT_LANGUAGE;
        }
    }

    private Map<String, Object> buildRoleResponse(Object[] result) {
        Map<String, Object> response = new HashMap<>();
        response.put("code", result[0]);
        response.put("label", result[1]);
        response.put("description", result[2]);
        response.put("isActive", result[3]);
        return response;
    }

    private List<Map<String, Object>> convertToRoleResponseList(List<Object[]> results) {
        List<Map<String, Object>> roles = new ArrayList<>();
        for (Object[] row : results) {
            Map<String, Object> role = new HashMap<>();
            role.put("id", row[0]);
            role.put("code", row[1]);
            role.put("label", row[2]);
            role.put("description", row[3]);
            role.put("isActive", row[4]);
            roles.add(role);
        }
        return roles;
    }
}

