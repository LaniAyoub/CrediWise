package ClientMicroservice.resources;

import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import ClientMicroservice.entities.Clients;
import ClientMicroservice.repositories.ClientRepository;

import java.util.List;

@Path("/api/clients")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ClientResource {

    @Inject
    ClientRepository clientRepository;

    @POST
    @Transactional
    public Response create(@Valid Clients client) {
        clientRepository.persist(client);
        return Response.status(Response.Status.CREATED).entity(client).build();
    }

    @GET
    public List<Clients> getAll() {
        return clientRepository.listAll();
    }

    @GET
    @Path("/id/{idClient}")
    public Response getByIdClient(@PathParam("idClient") String idClient) {
        Clients client = clientRepository.findByIdClient(idClient);
        if (client == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("Client avec ID " + idClient + " non trouvé").build();
        }
        return Response.ok(client).build();
    }


    @DELETE
    @Path("/{id}")
    @Transactional
    public Response delete(@PathParam("id") Long id) {
        boolean deleted = clientRepository.deleteById(id);
        return deleted ? Response.noContent().build()
                : Response.status(Response.Status.NOT_FOUND).build();
    }
}
