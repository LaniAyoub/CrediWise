package org.acme.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * PermissionTypeTranslation Entity
 * Stores localized labels for permission types
 */
@Entity
@Table(name = "permission_type_translations", indexes = {
        @Index(name = "idx_perm_trans_perm", columnList = "permission_type_id"),
        @Index(name = "idx_perm_trans_lang", columnList = "language_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_permission_type_trans", columnNames = {"permission_type_id", "language_id"})
})
public class PermissionTypeTranslation extends PanacheEntity {

    @NotNull(message = "Permission type is mandatory")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "permission_type_id", nullable = false)
    private PermissionType permissionType;

    @NotNull(message = "Language is mandatory")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "language_id", nullable = false)
    private Language language;

    @NotBlank(message = "Label is mandatory")
    @Column(name = "label", nullable = false, length = 100)
    private String label;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public PermissionTypeTranslation() {
    }

    public PermissionTypeTranslation(PermissionType permissionType, Language language, String label) {
        this.permissionType = permissionType;
        this.language = language;
        this.label = label;
    }

    public PermissionType getPermissionType() { return permissionType; }
    public void setPermissionType(PermissionType permissionType) { this.permissionType = permissionType; }
    
    public Language getLanguage() { return language; }
    public void setLanguage(Language language) { this.language = language; }
    
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    @Override
    public String toString() {
        return "PermissionTypeTranslation{" +
                "id=" + id +
                ", permissionType=" + permissionType.getCode() +
                ", language=" + language.getCode() +
                ", label='" + label + '\'' +
                '}';
    }
}

