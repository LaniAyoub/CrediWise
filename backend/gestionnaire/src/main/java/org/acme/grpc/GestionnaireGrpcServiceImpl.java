package org.acme.grpc;

import io.quarkus.grpc.GrpcService;
import io.smallrye.common.annotation.Blocking;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import org.acme.entity.Agence;
import org.acme.entity.Gestionnaire;
import org.acme.repository.AgenceRepository;
import org.acme.repository.GestionnaireRepository;

import java.util.Optional;
import java.util.UUID;

@GrpcService
public class GestionnaireGrpcServiceImpl implements GestionnaireService {

    @Inject
    AgenceRepository agenceRepository;

    @Inject
    GestionnaireRepository gestionnaireRepository;

    @Override
    @Blocking
    public Uni<AgenceResponse> getAgenceById(AgenceRequest request) {
        return Uni.createFrom().item(() -> {
            Optional<Agence> opt = agenceRepository.findByIdOptional(request.getIdBranch());
            if (opt.isEmpty()) {
                return AgenceResponse.newBuilder().setFound(false).build();
            }
            Agence a = opt.get();
            return AgenceResponse.newBuilder()
                    .setFound(true)
                    .setIdBranch(a.getIdBranch())
                    .setLibelle(a.getLibelle() != null ? a.getLibelle() : "")
                    .setWording(a.getWording() != null ? a.getWording() : "")
                    .setIsActive(Boolean.TRUE.equals(a.getIsActive()))
                    .build();
        });
    }

    @Override
    @Blocking
    public Uni<GestionnaireResponse> getGestionnaireById(GestionnaireRequest request) {
        return Uni.createFrom().item(() -> {
            UUID id;
            try {
                id = UUID.fromString(request.getId());
            } catch (IllegalArgumentException e) {
                return GestionnaireResponse.newBuilder().setFound(false).build();
            }
            Optional<Gestionnaire> opt = gestionnaireRepository.findByIdOptional(id);
            if (opt.isEmpty()) {
                return GestionnaireResponse.newBuilder().setFound(false).build();
            }
            Gestionnaire g = opt.get();
            GestionnaireResponse.Builder builder = GestionnaireResponse.newBuilder()
                    .setFound(true)
                    .setId(g.getId().toString())
                    .setFirstName(g.getFirstName() != null ? g.getFirstName() : "")
                    .setLastName(g.getLastName() != null ? g.getLastName() : "")
                    .setEmail(g.getEmail() != null ? g.getEmail() : "")
                    .setRole(g.getRole() != null ? g.getRole() : "")
                    .setIsActive(Boolean.TRUE.equals(g.getIsActive()));
            if (g.getAgence() != null) {
                builder.setAgenceId(g.getAgence().getIdBranch() != null ? g.getAgence().getIdBranch() : "")
                        .setAgenceLibelle(g.getAgence().getLibelle() != null ? g.getAgence().getLibelle() : "");
            }
            return builder.build();
        });
    }
}

