package org.acme.repository;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import org.acme.dto.ClientSearchResultDTO;
import org.acme.entity.*;
import org.acme.entity.enums.ClientStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

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
    // SMART SEARCH — trigram-backed multi-field fuzzy search
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Full-text fuzzy search across all identifying fields.
     *
     * Strategy: ILIKE with trigram GIN indexes (V3 migration) makes '%q%' O(1)
     * at scale. Results are sorted by pg_trgm similarity so the best match
     * appears first. Capped at {@code limit} rows to keep payloads small.
     *
     * @param q     raw query string (trimmed, case-insensitive)
     * @param limit max rows to return (recommended: 10–15)
     */
    public List<ClientSearchResultDTO> smartSearch(String q, int limit) {
        String like = "%" + q.toLowerCase() + "%";

        @SuppressWarnings("unchecked")
        List<Object[]> rows = getEntityManager()
                .createNativeQuery(
                        "SELECT id::text, client_type, status, first_name, last_name, " +
                        "       company_name, national_id, primary_phone, email, cbs_id, agence_id, " +
                        "       GREATEST( " +
                        "           similarity(COALESCE(LOWER(first_name),''), :q), " +
                        "           similarity(COALESCE(LOWER(last_name),''),  :q), " +
                        "           similarity(COALESCE(LOWER(company_name),''), :q), " +
                        "           similarity(COALESCE(national_id,''), :q), " +
                        "           similarity(COALESCE(primary_phone,''), :q), " +
                        "           similarity(COALESCE(LOWER(email),''), :q), " +
                        "           similarity(COALESCE(LOWER(cbs_id),''), :q) " +
                        "       ) AS score " +
                        "FROM clients " +
                        "WHERE  LOWER(first_name)   ILIKE :like " +
                        "    OR LOWER(last_name)    ILIKE :like " +
                        "    OR LOWER(company_name) ILIKE :like " +
                        "    OR national_id         ILIKE :like " +
                        "    OR primary_phone       ILIKE :like " +
                        "    OR LOWER(email)        ILIKE :like " +
                        "    OR LOWER(cbs_id)       ILIKE :like " +
                        "ORDER BY score DESC, last_name, first_name " +
                        "LIMIT :limit"
                )
                .setParameter("q",    q.toLowerCase())
                .setParameter("like", like)
                .setParameter("limit", limit)
                .getResultList();

        return rows.stream()
                .map(r -> new ClientSearchResultDTO(
                        (String) r[0],
                        (String) r[1],
                        (String) r[2],
                        (String) r[3],
                        (String) r[4],
                        (String) r[5],
                        (String) r[6],
                        (String) r[7],
                        (String) r[8],
                        (String) r[9],
                        (String) r[10]
                ))
                .collect(Collectors.toList());
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
