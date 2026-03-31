package CreditRequestMicroservice.repositories;


import CreditRequestMicroservice.entities.Demande;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class DemandeRepository implements PanacheRepositoryBase<Demande, UUID> {

    public Demande findById(UUID id) {
        return findByIdOptional(id).orElse(null);
    }

    public List<Demande> listAllDemandes() {
        return listAll();
    }

    public List<Demande> findByClientId(UUID clientId) {
        return list("clientId", clientId);
    }

    public Optional<Demande> findByIdWithDetails(UUID id) {
        return findByIdOptional(id); // Panache charge les listes avec fetch LAZY si besoin
    }
}
