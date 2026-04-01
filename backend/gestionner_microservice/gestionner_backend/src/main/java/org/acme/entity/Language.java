package org.acme.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Language Entity
 * Represents supported languages for the application (e.g., en, fr)
 * 
 * @author Backend Architecture Team
 * @version 1.0
 */
@Entity
@Table(name = "languages", indexes = {
        @Index(name = "idx_languages_code", columnList = "code", unique = true)
})
public class Language extends PanacheEntity {

    @NotBlank(message = "Language code is mandatory")
    @Column(name = "code", nullable = false, unique = true, length = 5)
    private String code;  // 'en', 'fr'

    @NotBlank(message = "Language name is mandatory")
    @Column(name = "name", nullable = false, length = 50)
    private String name;  // 'English', 'Français'

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Constructors
    public Language() {
    }

    public Language(String code, String name) {
        this.code = code;
        this.name = name;
        this.isActive = true;
    }

    public Language(String code, String name, Boolean isActive) {
        this.code = code;
        this.name = name;
        this.isActive = isActive;
    }

    // Getters & Setters
    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "Language{" +
                "id=" + id +
                ", code='" + code + '\'' +
                ", name='" + name + '\'' +
                ", isActive=" + isActive +
                '}';
    }
}

