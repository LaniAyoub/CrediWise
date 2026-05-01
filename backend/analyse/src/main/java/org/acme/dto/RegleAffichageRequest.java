package org.acme.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class RegleAffichageRequest {

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

    @NotBlank
    @Pattern(regexp = "<5k|>5k", message = "navigation must be '<5k' or '>5k'")
    public String navigation;
}
