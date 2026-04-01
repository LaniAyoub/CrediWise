package org.acme.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class GestionnaireAgenceUpdateDTO {

    @NotBlank
    private String agenceId;
}

