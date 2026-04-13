package org.acme.repository;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import org.acme.entity.Agence;

@ApplicationScoped
public class AgenceRepository implements PanacheRepositoryBase<Agence, String> {
    public boolean existsById(String idBranch) {
        return count("idBranch", idBranch) > 0;
    }
    
}

