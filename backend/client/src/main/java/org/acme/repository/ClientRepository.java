package org.acme.repository;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import org.acme.entity.*;
import org.acme.entity.enums.ClientStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class ClientRepository implements PanacheRepositoryBase<Client, UUID> {

    public boolean existsByEmail(String email) {
        return count("email", email) > 0;
    }

    public boolean existsByNationalId(String nationalId) {
        return count("nationalId", nationalId) > 0;
    }

    public boolean existsByCbsId(String cbsId) {
        return count("cbsId", cbsId) > 0;
    }

    public List<Client> findByStatus(ClientStatus status, int page, int size) {
        return find("status", status).page(page, size).list();
    }

    public List<Client> findByAgenceId(String agenceId, int page, int size) {
        return find("agenceId", agenceId).page(page, size).list();
    }

    public List<Client> findAllPaged(int page, int size) {
        return findAll().page(page, size).list();
    }
     public Optional<Client> findByNationalId(String nationalId) {
        return find("nationalId", nationalId).firstResultOptional();
    }

    public Optional<Client> findByPrimaryPhone(String primaryPhone) {
        return find("primaryPhone", primaryPhone).firstResultOptional();
    }


    // ─────────────────────────────────────────────────────────────────────────
    // NEW METHODS: Find reference entities by libelle
    // ─────────────────────────────────────────────────────────────────────────

    public Optional<Segment> findSegmentByLibelle(String libelle) {
        return getEntityManager().createQuery(
                        "SELECT s FROM Segment s WHERE s.libelle = ?1", Segment.class)
                .setParameter(1, libelle)
                .getResultStream()
                .findFirst();
    }

    public Optional<AccountType> findAccountTypeByLibelle(String libelle) {
        return getEntityManager().createQuery(
                        "SELECT a FROM AccountType a WHERE a.libelle = ?1", AccountType.class)
                .setParameter(1, libelle)
                .getResultStream()
                .findFirst();
    }
    public Optional<SecteurActivite> findSecteurActiviteByLibelle(String libelle) {
        return getEntityManager().createQuery(
                        "SELECT s FROM SecteurActivite s WHERE s.libelle = ?1", SecteurActivite.class)
                .setParameter(1, libelle)
                .getResultStream()
                .findFirst();
    }

    public Optional<SousActivite> findSousActiviteByLibelle(String libelle) {
        return getEntityManager().createQuery(
                        "SELECT s FROM SousActivite s WHERE s.libelle = ?1", SousActivite.class)
                .setParameter(1, libelle)
                .getResultStream()
                .findFirst();
    }
}
