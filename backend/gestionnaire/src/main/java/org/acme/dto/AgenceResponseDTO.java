package org.acme.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AgenceResponseDTO {
    String idBranch;
    String libelle;
    String wording;
    Boolean active;
}
