package ClientMicroservice.repositories;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import ClientMicroservice.entities.Clients;
import java.util.List;
@ApplicationScoped
public class ClientRepository implements PanacheRepository<Clients> {

    public Clients findByIdClient(String idClient) {
        return find("idClient", idClient).firstResult();
    }

    public List<Clients> searchByName(String nom) {
        return find("nom like ?1 or prenom like ?1", "%" + nom + "%").list();
    }
}