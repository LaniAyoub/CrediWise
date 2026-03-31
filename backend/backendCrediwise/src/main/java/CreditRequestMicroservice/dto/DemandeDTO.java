package CreditRequestMicroservice.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class DemandeDTO {
    public UUID id;
    public UUID clientId; // Référence obligatoire vers le client (récupéré automatiquement via le microservice Client)

    // === OBJET DU CRÉDIT ===
    public String objetDescription;           // Description de l'objet et du projet du client
    public BigDecimal montantDemande;         // ex: 20000
    public Integer dureeDemandee;             // en mois, ex: 6
    public String produit;                    // ex: "Crédit Micro (Tatouir)"
    public String typeObjet;                  // ex: "BFR - Marchandises"
    public BigDecimal capaciteRemboursementMensuelle; // TND déclarée par le client
    public String canalPriseDemande;          // ex: "Agence"

    // === Données client affichées automatiquement (snapshot pour le formulaire / PDF) ===
    public String firstName;
    public String lastName;
    public String sexe;
    public String scoreRubyx;
    public String statutKyc;
    public String nomGestionnaire;
    public String cycle;                      // ex: "FIRST_REQUEST" (String car microservice séparé)

    // === Consentement & signataires (auto) ===
    public String texteConsentement;
    public String signataires;                // ex: "Client principal + Gestionnaire assigné"
    public LocalDateTime dateCreation;

    // === Statut de la demande ===
    public String statut;                     // DRAFT / SUBMITTED / VALIDATED / REJECTED

    // === Listes ===
    public List<GuarantorDTO> guarantors = new ArrayList<>();
    public List<GuaranteeDTO> guarantees = new ArrayList<>();
}

