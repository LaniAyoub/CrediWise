package org.acme.repository;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import org.acme.entity.Client;
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
}
