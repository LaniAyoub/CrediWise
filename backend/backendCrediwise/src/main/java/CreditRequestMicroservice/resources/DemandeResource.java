package CreditRequestMicroservice.resources;

import CreditRequestMicroservice.dto.DemandeDTO;
import CreditRequestMicroservice.dto.GuarantorDTO;
import CreditRequestMicroservice.dto.GuaranteeDTO;
import CreditRequestMicroservice.entities.Demande;
import CreditRequestMicroservice.entities.Guarantor;
import CreditRequestMicroservice.entities.Guarantee;
import CreditRequestMicroservice.repositories.DemandeRepository;
import ClientMicroservice.entities.Clients;
import ClientMicroservice.repositories.ClientRepository;
import io.quarkus.narayana.jta.QuarkusTransaction;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.UUID;

@Path("/demandes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class DemandeResource {

    @Inject
    DemandeRepository demandeRepository;

    @Inject
    ClientRepository clientRepository;

    // ==================== CREATE ====================
    @POST
    @Transactional
    public Response create(DemandeDTO dto) {
        if (dto.clientId == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("{\"error\": \"clientId est obligatoire\"}").build();
        }

        // 1. Récupération du client EN DEHORS de la transaction principale
        Clients client = QuarkusTransaction.suspendingExisting().call(() ->
                clientRepository.findById(dto.clientId)
        );

        if (client == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("{\"error\": \"Client non trouvé\"}").build();
        }

        // 2. Création de la demande (dans la transaction normale)
        Demande demande = new Demande();

        // Auto-remplissage complet du client
        demande.clientId = dto.clientId;
        demande.firstName = client.firstName;
        demande.lastName = client.lastName;
        demande.sexe = client.sexe;
        demande.scoreRubyx = client.scoring;
        demande.statutKyc = client.status;
        demande.nomGestionnaire = client.assignedManager;
        demande.cycle = client.cycle != null ? client.cycle.name() : "FIRST_REQUEST";

        // Champs du formulaire
        demande.objetDescription = dto.objetDescription;
        demande.montantDemande = dto.montantDemande;
        demande.dureeDemandee = dto.dureeDemandee;
        demande.produit = dto.produit;
        demande.typeObjet = dto.typeObjet;
        demande.capaciteRemboursementMensuelle = dto.capaciteRemboursementMensuelle;
        demande.canalPriseDemande = dto.canalPriseDemande;

        demande.texteConsentement = dto.texteConsentement != null ? dto.texteConsentement :
                "Je consens au traitement de mes données pour l'étude de ma demande de crédit.";

        demande.statut = "DRAFT";

        // Garants et Garanties
        mapGuarantors(dto, demande);
        mapGuarantees(dto, demande);

        demandeRepository.persist(demande);

        DemandeDTO response = mapEntityToDto(demande);
        return Response.status(Response.Status.CREATED).entity(response).build();
    }

    // ==================== Mapping Helpers ====================
    private void mapGuarantors(DemandeDTO dto, Demande demande) {
        demande.guarantors.clear();
        for (GuarantorDTO g : dto.guarantors) {
            Guarantor guarantor = new Guarantor();
            guarantor.idAmplitude = g.idAmplitude;
            guarantor.nom = g.nom;
            guarantor.relationAvecClient = g.relationAvecClient;
            guarantor.demande = demande;
            demande.guarantors.add(guarantor);
        }
    }

    private void mapGuarantees(DemandeDTO dto, Demande demande) {
        demande.guarantees.clear();
        for (GuaranteeDTO g : dto.guarantees) {
            Guarantee garantie = new Guarantee();
            garantie.proprietaire = g.proprietaire;
            garantie.type = g.type;
            garantie.valeurEstimee = g.valeurEstimee;
            garantie.demande = demande;
            demande.guarantees.add(garantie);
        }
    }

    private DemandeDTO mapEntityToDto(Demande d) {
        DemandeDTO dto = new DemandeDTO();
        dto.id = d.id;
        dto.clientId = d.clientId;
        dto.firstName = d.firstName;
        dto.lastName = d.lastName;
        dto.sexe = d.sexe;
        dto.scoreRubyx = d.scoreRubyx;
        dto.statutKyc = d.statutKyc;
        dto.nomGestionnaire = d.nomGestionnaire;
        dto.cycle = d.cycle;

        dto.objetDescription = d.objetDescription;
        dto.montantDemande = d.montantDemande;
        dto.dureeDemandee = d.dureeDemandee;
        dto.produit = d.produit;
        dto.typeObjet = d.typeObjet;
        dto.capaciteRemboursementMensuelle = d.capaciteRemboursementMensuelle;
        dto.canalPriseDemande = d.canalPriseDemande;
        dto.texteConsentement = d.texteConsentement;
        dto.signataires = d.signataires;
        dto.dateCreation = d.dateCreation;
        dto.statut = d.statut;

        // Garants
        for (Guarantor g : d.guarantors) {
            GuarantorDTO gd = new GuarantorDTO();
            gd.id = g.id;
            gd.idAmplitude = g.idAmplitude;
            gd.nom = g.nom;
            gd.relationAvecClient = g.relationAvecClient;
            dto.guarantors.add(gd);
        }
        // Garanties
        for (Guarantee g : d.guarantees) {
            GuaranteeDTO gd = new GuaranteeDTO();
            gd.id = g.id;
            gd.proprietaire = g.proprietaire;
            gd.type = g.type;
            gd.valeurEstimee = g.valeurEstimee;
            dto.guarantees.add(gd);
        }
        return dto;
    }
}