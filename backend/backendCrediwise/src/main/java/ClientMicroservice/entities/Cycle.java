package ClientMicroservice.entities;

public enum Cycle {
    FIRST_REQUEST,      // Première demande de crédit
    SUBSEQUENT_REQUEST  // Deuxième demande ou plus
}