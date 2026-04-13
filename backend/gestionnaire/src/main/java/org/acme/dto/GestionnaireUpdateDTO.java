package org.acme.dto;

import jakarta.validation.constraints.Past;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class GestionnaireUpdateDTO {

    private String numTelephone;
    private String firstName;
    private String lastName;

    @Past
    private LocalDate dateOfBirth;

    private String address;
    private String role;
    private Boolean active;
}
