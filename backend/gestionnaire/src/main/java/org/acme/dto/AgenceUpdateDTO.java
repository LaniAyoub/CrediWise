package org.acme.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class AgenceUpdateDTO {

    @Size(max = 100)
    private String libelle;

    @Size(max = 200)
    private String wording;

    private Boolean isActive;
}
