package org.acme.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class DemandeUpdateRequest {

    public String loanPurpose;

    @DecimalMin(value = "0.001", message = "requestedAmount must be positive")
    public BigDecimal requestedAmount;

    @Min(value = 1, message = "durationMonths must be at least 1")
    public Integer durationMonths;

    public String productId;
    public String assetType;
    public BigDecimal monthlyRepaymentCapacity;
    public String applicationChannel;
    public String consentText;

    public Boolean bankingRestriction;
    public Boolean legalIssueOrAccountBlocked;

    public List<GuarantorDto> guarantors;
    public List<GuaranteeDto> guarantees;
}
