package org.acme.repository;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import org.acme.entity.Demande;
import org.acme.entity.enums.DemandeStatut;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class DemandeRepository implements PanacheRepositoryBase<Demande, Long> {

    /** Active (non-deleted) demande by id. */
    public Optional<Demande> findActive(Long id) {
        return find("id = ?1 AND deletedAt IS NULL", id).firstResultOptional();
    }

    public List<Demande> findAllPaged(int page, int size) {
        return find("deletedAt IS NULL").page(page, size).list();
    }

    public List<Demande> findByClientId(UUID clientId, int page, int size) {
        return find("clientId = ?1 AND deletedAt IS NULL", clientId).page(page, size).list();
    }

    public List<Demande> findByStatut(DemandeStatut statut, int page, int size) {
        return find("status = ?1 AND deletedAt IS NULL", statut).page(page, size).list();
    }

    public long countByClientId(UUID clientId) {
        return count("clientId = ?1 AND deletedAt IS NULL", clientId);
    }
}
