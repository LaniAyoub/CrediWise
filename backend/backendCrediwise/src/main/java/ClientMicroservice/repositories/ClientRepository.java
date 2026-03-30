package ClientMicroservice.repositories;


import ClientMicroservice.entities.Clients;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class ClientRepository implements PanacheRepositoryBase<Clients, UUID> {

    /**
     * Trouver un client par son ID (UUID)
     */
    public Clients findById(UUID id) {
        return findByIdOptional(id).orElse(null);
    }

    public List<Clients> listAllClients() {
        return listAll();
    }

    public Optional<Clients> findByPhone(String phone) {
        return find("primaryPhone = ?1 OR secondaryPhone = ?1", phone)
                .firstResultOptional();
    }
    public Optional<Clients> findByCin(String cin) {
        return find("Cin = ?1 ", cin)
                .firstResultOptional();
    }

}