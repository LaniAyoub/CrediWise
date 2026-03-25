package ClientMicroservice.entities;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "clients")
public class Clients extends PanacheEntity {

    @Column(name = "id_client", nullable = false, unique = true)
    public String idClient;           // ex: "5135"

    @Enumerated(EnumType.STRING)
    @Column(name = "client_type", nullable = false)
    public TypeClient typeClient;     // PHYSIQUE ou MORALE

    // Champs communs
    public String agence;             // ex: "001 - Bizerte"
    public String gestionnaire;       // nom ou code du gestionnaire
    public String numeroCompte;
    public String cycle;

    // ─── Personne Physique ────────────────────────────────
    public String nom;
    public String prenom;
    public String sexe;
    public Integer age;

    // ─── Personne Morale ──────────────────────────────────
    public String sigle;
    @Column(name = "raison_sociale")
    public String raisonSociale;
    @Column(name = "nom_interlocuteur")
    public String nomInterlocuteurPrincipal;

    // Adresses
    @Column(name = "adresse_activite")
    public String adresseActivite;

    @Column(name = "adresse_domicile")
    public String adresseDomicile;

    @ManyToOne
    @JoinColumn(name = "secteur_activite_id")
    public SecteurActivite secteurActivite;

    public Clients() {
    }
}