package org.acme.repository;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import org.acme.entity.Gestionnaire;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class GestionnaireRepository implements PanacheRepositoryBase<Gestionnaire, UUID> {

    public Optional<Gestionnaire> findByEmail(String email) {
        return find("email", email).firstResultOptional();
    }

    public Optional<Gestionnaire> findByCin(String cin) {
        return find("cin", cin).firstResultOptional();
    }

    public List<Gestionnaire> findAllByRole(String roleCode) {
        return list("role", roleCode);
    }

    public List<Gestionnaire> findAllActive() {
        return list("isActive", true);
    }

    public long countByRole(String roleCode) {
        return count("role", roleCode);
    }

    public long countActive() {
        return count("isActive", true);
    }

    public boolean existsByEmail(String email) {
        return count("email", email) > 0;
    }

    public boolean existsByCin(String cin) {
        return count("cin", cin) > 0;
    }
}
