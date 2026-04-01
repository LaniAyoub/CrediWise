package org.acme.entity;

import io.quarkus.elytron.security.common.BcryptUtil;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "gestionnaires", indexes = {
        @Index(name = "idx_gestionnaire_email", columnList = "email", unique = true),
        @Index(name = "idx_gestionnaire_cin", columnList = "cin", unique = true),
        @Index(name = "idx_gestionnaire_role", columnList = "role"),
        @Index(name = "idx_gestionnaire_active", columnList = "is_active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "password")
@EqualsAndHashCode(of = "id", callSuper = false)
public class Gestionnaire extends PanacheEntityBase {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @NotBlank(message = "Email is mandatory")
    @Email(message = "Email should be valid")
    @Column(nullable = false, unique = true)
    private String email;

    @NotBlank(message = "CIN is mandatory")
    @Column(nullable = false, unique = true, length = 20)
    private String cin;

    @NotBlank(message = "Phone number is mandatory")
    @Column(name = "num_telephone", nullable = false)
    private String numTelephone;

    @NotBlank(message = "First name is mandatory")
    @Column(name = "first_name", nullable = false)
    private String firstName;

    @NotBlank(message = "Last name is mandatory")
    @Column(name = "last_name", nullable = false)
    private String lastName;

    @NotNull(message = "Date of birth is mandatory")
    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    private String address;

    @Column(nullable = false)
    private String password;

    @NotBlank(message = "Role is mandatory")
    @Column(nullable = false, length = 50)
    private String role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agence_id")
    private Agence agence;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by", columnDefinition = "uuid")
    private UUID createdBy;

    @Column(name = "updated_by", columnDefinition = "uuid")
    private UUID updatedBy;

    @Version
    private Long version;

    @PrePersist
    public void prePersist() {
        if (id == null) id = UUID.randomUUID();
        if (password != null && !password.startsWith("$2a$")) {
            password = BcryptUtil.bcryptHash(password);
        }
    }

    @PreUpdate
    public void preUpdate() {
        if (password != null && !password.startsWith("$2a$")) {
            password = BcryptUtil.bcryptHash(password);
        }
    }
}