package GestionnaireMicroservice.repositories;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import GestionnaireMicroservice.entities.Gestionnaires;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class GestionnaireRepository implements PanacheRepository<Gestionnaires> {

    public Optional<Gestionnaires> findByCin(String cin) {
        return find("cin", cin).firstResultOptional();
    }

    public Optional<Gestionnaires> findByEmail(String email) {
        return find("email", email).firstResultOptional();
    }

    public List<Gestionnaires> findByAgenceId(Long agenceId) {
        return find("agence.id", agenceId).list();
    }

    // Pour l'authentification future
    public Optional<Gestionnaires> findByEmailAndPassword(String email, String password) {
        return find("email = ?1 and password = ?2", email, password).firstResultOptional();
    }
}