package CreditRequestMicroservice.dto;

import java.util.UUID;

public class GuaranteeDTO {
    public UUID id;
    public String proprietaire;     // Nom du propriétaire de la garantie
    public String type;             // Type de garantie
    public String valeurEstimee; // TND
}