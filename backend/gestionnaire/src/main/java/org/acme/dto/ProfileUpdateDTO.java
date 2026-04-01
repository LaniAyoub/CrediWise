package org.acme.dto;

import jakarta.validation.constraints.Past;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class ProfileUpdateDTO {
    private String firstName;
    private String lastName;
    private String numTelephone;
    private String address;

    @Past
    private LocalDate dateOfBirth;
}
