package org.acme.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class GuarantorDto {
    public UUID id;
    public String amplitudeId;
    public String name;
    public String clientRelationship;
}
