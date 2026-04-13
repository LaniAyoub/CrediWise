package org.acme.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class GuaranteeDto {
    public UUID id;
    public String owner;
    public String type;
    public BigDecimal estimatedValue;
}
