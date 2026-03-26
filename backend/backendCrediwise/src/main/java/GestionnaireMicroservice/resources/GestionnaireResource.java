package GestionnaireMicroservice.resources;

import GestionnaireMicroservice.entities.Gestionnaires;
import GestionnaireMicroservice.repositories.GestionnaireRepository;
import GestionnaireMicroservice.services.PasswordService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.List;

@Path("/api/gestionnaires")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class GestionnaireResource {

    @Inject
    GestionnaireRepository repository;

    @Inject
    PasswordService passwordService;

    @Inject
    JsonWebToken jwt; // ← pour lire les infos du token si besoin

    // ===================== CREATE =====================
    // Seul HEAD_OFFICE peut créer un gestionnaire
    @POST
    @Transactional
    @RolesAllowed("HEAD_OFFICE_DECISION_MAKER")
    public Response create(Gestionnaires gestionnaire) {
        if (gestionnaire.email == null || gestionnaire.cin == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Email et CIN sont obligatoires").build();
        }
        if (gestionnaire.password != null) {
            gestionnaire.password = passwordService.hash(gestionnaire.password);
        }
        repository.persist(gestionnaire);
        return Response.status(Response.Status.CREATED).entity(gestionnaire).build();
    }

    // ===================== GET ALL =====================
    // Tous les rôles connectés peuvent voir la liste
    @GET
    @RolesAllowed({
            "HEAD_OFFICE_DECISION_MAKER",
            "BRANCH_DECISION_MAKER",
            "CLIENT_RELATIONSHIP_OFFICER",
            "CREDIT_RISK_ANALYST",
            "FRONT_OFFICE",
            "READ_ONLY",
            "TECHNICAL_USER"
    })
    public List<Gestionnaires> getAll() {
        return repository.listAll();
    }


    // ===================== UPDATE =====================
    // Seuls HEAD_OFFICE et BRANCH_DECISION_MAKER peuvent modifier
    @PUT
    @Path("/{id}")
    @Transactional
    @RolesAllowed({
            "HEAD_OFFICE_DECISION_MAKER",
            "BRANCH_DECISION_MAKER"
    })
    public Response update(@PathParam("id") Long id, Gestionnaires updated) {
        Gestionnaires existing = repository.findById(id);
        if (existing == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        if (updated.role != null) existing.role = updated.role;
        if (updated.agence != null) existing.agence = updated.agence;
        if (updated.numTelephone != null) existing.numTelephone = updated.numTelephone;
        if (updated.password != null) {
            existing.password = passwordService.hash(updated.password);
        }
        repository.persist(existing);
        return Response.ok(existing).build();
    }

    // ===================== DELETE =====================
    // Seul HEAD_OFFICE peut supprimer
    @DELETE
    @Path("/{id}")
    @Transactional
    @RolesAllowed("HEAD_OFFICE_DECISION_MAKER")
    public Response delete(@PathParam("id") Long id) {
        boolean deleted = repository.deleteById(id);
        if (deleted) {
            return Response.noContent().build();
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }
}