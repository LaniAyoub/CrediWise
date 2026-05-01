package org.acme.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class RegleAffichageResponse {
    public Long id;
    public String conditionLabel;
    public String pays;
    public String productId;
    public String productName;
    /** Comparison operator for the lower bound (e.g. >=, >, =). */
    public String opInf;
    public BigDecimal borneInf;
    /** Comparison operator for the upper bound (e.g. <=, <, =). */
    public String opSup;
    public BigDecimal borneSup;
    public String navigation;
    public Integer version;
    public Boolean isActive;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
}
