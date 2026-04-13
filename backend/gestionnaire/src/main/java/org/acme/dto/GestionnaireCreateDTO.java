package org.acme.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class GestionnaireCreateDTO {

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(max = 20)
    private String cin;

    @NotBlank
    private String numTelephone;

    @NotBlank
    private String firstName;

    @NotBlank
    private String lastName;

    @Past
    private LocalDate dateOfBirth;

    private String address;

    private String password;

    @NotBlank
    private String role;

    @NotBlank
    private String agenceId;
}
