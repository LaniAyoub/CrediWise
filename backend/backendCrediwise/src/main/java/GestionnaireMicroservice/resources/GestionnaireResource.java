package GestionnaireMicroservice.resources;

import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import GestionnaireMicroservice.entities.Gestionnaires;
import GestionnaireMicroservice.repositories.GestionnaireRepository;
import jakarta.annotation.security.RolesAllowed;
import jakarta.annotation.security.PermitAll;

import java.util.List;

@Path("/api/gestionnaires")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class GestionnaireResource {

    @Inject
    GestionnaireRepository repository;

    // ===================== CREATE =====================
    @POST
    @Transactional
    public Response create(Gestionnaires gestionnaire) {
        if (gestionnaire.email == null || gestionnaire.cin == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Email et CIN sont obligatoires").build();
        }
        repository.persist(gestionnaire);
        return Response.status(Response.Status.CREATED).entity(gestionnaire).build();
    }

    // ===================== GET ALL =====================
    @GET
    public List<Gestionnaires> getAll() {
        return repository.listAll();
    }

    // ===================== GET BY CIN =====================
    @GET
    @Path("/cin/{cin}")
    public Response getByCin(@PathParam("cin") String cin) {
        Gestionnaires g = repository.findByCin(cin).orElse(null);
        if (g == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(g).build();
    }

    // ===================== UPDATE (rôle, agence, téléphone, password) =====================
    @PUT
    @Path("/{id}")
    @RolesAllowed({"HEAD_OFFICE_DECISION_MAKER"})
    @Transactional
    public Response update(@PathParam("id") Long id, Gestionnaires updated) {
        Gestionnaires existing = repository.findById(id);
        if (existing == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        // Mise à jour des champs autorisés seulement
        if (updated.role != null) existing.role = updated.role;
        if (updated.agence != null) existing.agence = updated.agence;
        if (updated.numTelephone != null) existing.numTelephone = updated.numTelephone;
        if (updated.password != null) existing.password = updated.password;   // À hacher plus tard !

        repository.persist(existing);
        return Response.ok(existing).build();
    }

    // ===================== DELETE =====================
    @DELETE
    @Path("/{id}")
    @RolesAllowed({"HEAD_OFFICE_DECISION_MAKER"})
    @Transactional
    public Response delete(@PathParam("id") Long id) {
        boolean deleted = repository.deleteById(id);
        if (deleted) {
            return Response.noContent().build();
        }
        return Response.status(Response.Status.NOT_FOUND).build();
    }
}