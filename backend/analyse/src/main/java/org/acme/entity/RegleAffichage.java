package org.acme.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "regle_affichage")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class RegleAffichage extends PanacheEntity {

    @Column(name = "condition_label", length = 100)
    public String conditionLabel;

    @Column(name = "pays", length = 100)
    public String pays;

    @Column(name = "product_id", length = 50)
    public String productId;

    @Column(name = "product_name", length = 200)
    public String productName;

    /** Comparison operator for the lower bound (e.g. &gt;=, &gt;, =). */
    @Column(name = "op_inf", length = 10)
    public String opInf;

    @Column(name = "borne_inf", precision = 15, scale = 3)
    public BigDecimal borneInf;

    /** Comparison operator for the upper bound (e.g. &lt;=, &lt;, =). */
    @Column(name = "op_sup", length = 10)
    public String opSup;

    @Column(name = "borne_sup", precision = 15, scale = 3)
    public BigDecimal borneSup;

    /** "<5k" or ">5k" */
    @Column(name = "navigation", nullable = false, length = 10)
    public String navigation;

    // ── Versioning ────────────────────────────────────────────────────────────

    /** Incremented each time this logical rule is edited (new row created). */
    @Column(name = "version", nullable = false)
    public Integer version = 1;

    /**
     * false when this row has been superseded by a newer version.
     * Only active rules are shown in the admin list and applied to dossiers.
     */
    @Column(name = "is_active", nullable = false)
    public Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    public LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    public LocalDateTime updatedAt;
}
