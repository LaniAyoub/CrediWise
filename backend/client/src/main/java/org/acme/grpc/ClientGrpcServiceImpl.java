package org.acme.grpc;

import io.quarkus.grpc.GrpcService;
import io.smallrye.common.annotation.Blocking;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.acme.entity.Client;
import org.acme.repository.ClientRepository;

import java.util.Optional;
import java.util.UUID;

@GrpcService
public class ClientGrpcServiceImpl implements ClientService {

    @Inject
    ClientRepository clientRepository;

    @Override
    @Blocking
    public Uni<ClientResponse> getClientById(ClientRequest request) {
        return Uni.createFrom().item(() -> {
            UUID id;
            try {
                id = UUID.fromString(request.getId());
            } catch (IllegalArgumentException e) {
                return ClientResponse.newBuilder().setFound(false).build();
            }

            Optional<Client> opt = clientRepository.findByIdOptional(id);
            if (opt.isEmpty()) {
                return ClientResponse.newBuilder().setFound(false).build();
            }

            Client c = opt.get();
            ClientResponse.Builder b = ClientResponse.newBuilder()
                    .setFound(true)
                    .setId(c.getId().toString())
                    .setClientType(c.getClientType() != null ? c.getClientType().name() : "")
                    .setStatus(c.getStatus() != null ? c.getStatus().name() : "")
                    .setFirstName(safe(c.getFirstName()))
                    .setLastName(safe(c.getLastName()))
                    .setDateOfBirth(c.getDateOfBirth() != null ? c.getDateOfBirth().toString() : "")
                    .setNationalId(safe(c.getNationalId()))
                    .setGender(c.getGender() != null ? c.getGender().name() : "")
                    .setMaritalStatus(c.getSituationFamiliale() != null ? c.getSituationFamiliale().name() : "")
                    .setNationality(safe(c.getNationality()))
                    .setMonthlyIncome(c.getMonthlyIncome() != null ? c.getMonthlyIncome().toPlainString() : "")
                    .setCompanyName(safe(c.getCompanyName()))
                    .setSigle(safe(c.getSigle()))
                    .setRegistrationNumber(safe(c.getRegistrationNumber()))
                    .setPrincipalInterlocutor(safe(c.getPrincipalInterlocutor()))
                    .setEmail(safe(c.getEmail()))
                    .setPrimaryPhone(safe(c.getPrimaryPhone()))
                    .setSecondaryPhone(safe(c.getSecondaryPhone()))
                    .setAddressStreet(safe(c.getAddressStreet()))
                    .setAddressCity(safe(c.getAddressCity()))
                    .setAddressPostal(safe(c.getAddressPostal()))
                    .setAddressCountry(safe(c.getAddressCountry()))
                    .setAccountNumber(safe(c.getAccountNumber()))
                    .setSegment(c.getSegment() != null ? safe(c.getSegment().getLibelle()) : "")
                    .setAccountType(c.getAccountType() != null ? safe(c.getAccountType().getLibelle()) : "")
                    .setBusinessSector(c.getSecteurActivite() != null ? safe(c.getSecteurActivite().getLibelle()) : "")
                    .setBusinessActivityGroup(c.getActivite() != null ? safe(c.getActivite().getLibelle()) : "")
                    .setBusinessActivity(c.getSousActivite() != null ? safe(c.getSousActivite().getLibelle()) : "")
                    .setBranchId(safe(c.getAgenceId()))
                    .setAssignedManagerId(c.getAssignedManagerId() != null ? c.getAssignedManagerId().toString() : "")
                    .setScoring(safe(c.getScoring()))
                    .setCycle(c.getCycle() != null ? String.valueOf(c.getCycle()) : "0")
                    .setIfcLevelOfRisk(c.getRiskLevel() != null ? safe(c.getRiskLevel().getIfcLevelOfRisk()) : "");

            return b.build();
        });
    }

    @Override
    @Blocking
    @Transactional
    public Uni<ClientCycleUpdateResponse> incrementClientCycle(ClientRequest request) {
        return Uni.createFrom().item(() -> {
            UUID id;
            try {
                id = UUID.fromString(request.getId());
            } catch (IllegalArgumentException e) {
                return ClientCycleUpdateResponse.newBuilder()
                        .setSuccess(false)
                        .setCycle("")
                        .build();
            }

            Optional<Client> opt = clientRepository.findByIdOptional(id);
            if (opt.isEmpty()) {
                return ClientCycleUpdateResponse.newBuilder()
                        .setSuccess(false)
                        .setCycle("")
                        .build();
            }

            Client client = opt.get();
            int currentCycle = client.getCycle() != null ? client.getCycle() : 0;
            int nextCycle = currentCycle + 1;
            client.setCycle(nextCycle);

            return ClientCycleUpdateResponse.newBuilder()
                    .setSuccess(true)
                    .setCycle(String.valueOf(nextCycle))
                    .build();
        });
    }

    @Override
    @Blocking
    @Transactional
    public Uni<ClientScoringUpdateResponse> updateClientScoring(ClientScoringUpdateRequest request) {
        return Uni.createFrom().item(() -> {
            UUID id;
            try {
                id = UUID.fromString(request.getId());
            } catch (IllegalArgumentException e) {
                return ClientScoringUpdateResponse.newBuilder().setSuccess(false).build();
            }

            Optional<Client> opt = clientRepository.findByIdOptional(id);
            if (opt.isEmpty()) {
                return ClientScoringUpdateResponse.newBuilder().setSuccess(false).build();
            }

            opt.get().setScoring(request.getScoring());

            return ClientScoringUpdateResponse.newBuilder().setSuccess(true).build();
        });
    }

    private String safe(String value) {
        return value != null ? value : "";
    }
}
