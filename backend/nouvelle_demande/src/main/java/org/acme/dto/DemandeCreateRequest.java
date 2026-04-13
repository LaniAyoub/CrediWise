package org.acme.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class DemandeCreateRequest {

    @NotNull(message = "clientId is required")
    public UUID clientId;

    @NotNull(message = "loanPurpose is required")
    public String loanPurpose;

    @NotNull(message = "requestedAmount is required")
    @DecimalMin(value = "0.001", message = "requestedAmount must be positive")
    public BigDecimal requestedAmount;

    @NotNull(message = "durationMonths is required")
    @Min(value = 1, message = "durationMonths must be at least 1")
    public Integer durationMonths;

    public String productId;
    public String assetType;
    public BigDecimal monthlyRepaymentCapacity;
    public String applicationChannel;
    public String consentText;

    public List<GuarantorDto> guarantors;
    public List<GuaranteeDto> guarantees;
}
