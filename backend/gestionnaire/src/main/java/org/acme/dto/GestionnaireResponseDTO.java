package org.acme.dto;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Value
@Builder
public class GestionnaireResponseDTO {
	UUID id;
	String email;
	String cin;
	String numTelephone;
	String firstName;
	String lastName;
	LocalDate dateOfBirth;
	String address;
	String role;
	Boolean active;
	LocalDateTime createdAt;
	LocalDateTime updatedAt;
	AgenceResponseDTO agence;
}

