package ClientMicroservice.resources;

import ClientMicroservice.dto.ClientDTO;
import ClientMicroservice.entities.*;
import ClientMicroservice.repositories.ClientRepository;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.UUID;

@Path("/clients")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ClientResource {

    @Inject
    ClientRepository clientRepository;

    // ==================== CREATE ====================
    @POST
    @Transactional
    public Response create(ClientDTO dto) {
        Clients client = new Clients();
        mapDtoToEntity(dto, client);

        clientRepository.persist(client);

        ClientDTO response = mapEntityToDto(client);
        return Response.status(Response.Status.CREATED).entity(response).build();
    }

    // ==================== GET BY ID ====================
    @GET
    @Path("/id/{id}")
    public Response getById(@PathParam("id") UUID id) {
        Clients client = clientRepository.findById(id);
        if (client == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(mapEntityToDto(client)).build();
    }
    // ==================== GET BY phone ====================

    @GET
    @Path("/phone/{phone}")
    public Response getByPhone(@PathParam("phone") String phone) {
        return clientRepository.findByPhone(phone)
                .map(c -> Response.ok(mapEntityToDto(c)).build())
                .orElse(Response.status(Response.Status.NOT_FOUND).build());
    }
    // ==================== GET BY Cin ====================

    @GET
    @Path("/cin/{cin}")
    public Response getByCin(@PathParam("cin") String cin) {

        return clientRepository.findByCin(cin)
                .map(client -> Response.ok(mapEntityToDto(client)).build())
                .orElse(Response.status(Response.Status.NOT_FOUND).build());
    }
    // ==================== UPDATE ====================
    @PUT
    @Path("/{id}")
    @Transactional
    public Response update(@PathParam("id") UUID id, ClientDTO dto) {
        Clients client = clientRepository.findById(id);
        if (client == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        mapDtoToEntity(dto, client);
        // clientRepository.persist(client); // Pas obligatoire avec Panache + dirty checking

        return Response.ok(mapEntityToDto(client)).build();
    }

    // ==================== Mapping ====================
    private void mapDtoToEntity(ClientDTO dto, Clients client) {
        client.clientType = dto.clientType;
        client.status = dto.status;
        client.segment = dto.segmentId != null ? Segment.findById(dto.segmentId) : null;
        client.scoring = dto.scoring;
        client.firstName = dto.firstName;
        client.lastName = dto.lastName;
        client.companyName = dto.companyName;
        client.registrationNumber = dto.registrationNumber;
        client.nationalId = dto.nationalId;
        client.dateOfBirth = dto.dateOfBirth;
        client.nationality = dto.nationality ;
        client.taxIdentifier = dto.taxIdentifier;
        client.sexe = dto.sexe;
        client.email = dto.email;
        client.Cin = dto.Cin;
        client.primaryPhone = dto.primaryPhone;
        client.secondaryPhone = dto.secondaryPhone;
        client.addressStreet = dto.addressStreet;
        client.addressCity = dto.addressCity;
        client.addressPostal = dto.addressPostal;
        client.addressCountry = dto.addressCountry;
        client.agency = dto.idBranch != null ? Agency.findById(dto.idBranch) : null;
        client.sectorActivity = dto.sectorActivityId != null ? SectorActivity.findById(dto.sectorActivityId) : null;
        client.subActivity = dto.subActivityId != null ? SubActivity.findById(dto.subActivityId) : null;
        client.cycle = dto.cycle;
        client.assignedManager = dto.assignedManager;
        client.principalInterlocutor = dto.principalInterlocutor;
        client.familySituation = dto.familySituationId != null ? FamilySituation.findById(dto.familySituationId) : null;
    }

    private ClientDTO mapEntityToDto(Clients client) {
        ClientDTO dto = new ClientDTO();
        dto.id = client.id;
        dto.clientType = client.clientType;
        dto.status = client.status;
        dto.segmentId = client.segment != null ? client.segment.id : null;
        dto.scoring = client.scoring;
        dto.firstName = client.firstName;
        dto.lastName = client.lastName;
        dto.companyName = client.companyName;
        dto.registrationNumber = client.registrationNumber;
        dto.nationalId = client.nationalId;
        dto.dateOfBirth = client.dateOfBirth;
        dto.nationality = client.nationality ;
        dto.taxIdentifier = client.taxIdentifier;
        dto.sexe = client.sexe;
        dto.email = client.email;
        dto.Cin = client.Cin;
        dto.primaryPhone = client.primaryPhone;
        dto.secondaryPhone = client.secondaryPhone;
        dto.addressStreet = client.addressStreet;
        dto.addressCity = client.addressCity;
        dto.addressPostal = client.addressPostal;
        dto.addressCountry = client.addressCountry;
        dto.idBranch = client.agency != null ? client.agency.idBranch : null;
        dto.sectorActivityId = client.sectorActivity != null ? client.sectorActivity.id : null;
        dto.subActivityId = client.subActivity != null ? client.subActivity.id : null;
        dto.cycle = client.cycle;
        dto.assignedManager = client.assignedManager;
        dto.principalInterlocutor = client.principalInterlocutor;
        dto.familySituationId = client.familySituation != null ? client.familySituation.id : null;
        dto.createdAt = client.createdAt;
        dto.updatedAt = client.updatedAt;
        return dto;
    }

    @GET
    public List<Clients> getAll() {
        return clientRepository.listAll();
    }
}