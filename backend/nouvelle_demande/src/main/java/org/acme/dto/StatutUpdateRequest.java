package org.acme.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.acme.entity.enums.DemandeStatut;

@Getter
@Setter
@NoArgsConstructor
public class StatutUpdateRequest {

    @NotNull(message = "status is required")
    public DemandeStatut status;
}
