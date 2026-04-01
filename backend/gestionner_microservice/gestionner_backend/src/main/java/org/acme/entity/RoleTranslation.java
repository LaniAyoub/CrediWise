package org.acme.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * RoleTranslation Entity
 * Stores localized labels and descriptions for roles
 * 
 * Strategy: Translation table per entity following standard i18n patterns
 * - Separates translatable content from core business logic
 * - Allows efficient querying by language
 * - Supports adding new languages without schema changes
 * 
 * @author Backend Architecture Team
 * @version 1.0
 */
@Entity
@Table(name = "role_translations", indexes = {
        @Index(name = "idx_role_trans_role", columnList = "role_id"),
        @Index(name = "idx_role_trans_lang", columnList = "language_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_role_translations", columnNames = {"role_id", "language_id"})
})
public class RoleTranslation extends PanacheEntity {

    @NotNull(message = "Role is mandatory")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @NotNull(message = "Language is mandatory")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "language_id", nullable = false)
    private Language language;

    @NotBlank(message = "Label is mandatory")
    @Column(name = "label", nullable = false, length = 200)
    private String label;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Constructors
    public RoleTranslation() {
    }

    public RoleTranslation(Role role, Language language, String label) {
        this.role = role;
        this.language = language;
        this.label = label;
    }

    public RoleTranslation(Role role, Language language, String label, String description) {
        this.role = role;
        this.language = language;
        this.label = label;
        this.description = description;
    }

    // Getters & Setters
    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public Language getLanguage() {
        return language;
    }

    public void setLanguage(Language language) {
        this.language = language;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public String toString() {
        return "RoleTranslation{" +
                "id=" + id +
                ", role=" + role.getCode() +
                ", language=" + language.getCode() +
                ", label='" + label + '\'' +
                '}';
    }
}

