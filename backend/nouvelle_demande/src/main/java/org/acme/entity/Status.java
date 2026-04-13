package org.acme.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

@Entity
@Table(name = "status")
public class Status extends PanacheEntityBase {

    @Id
    @Column(name = "id_status", length = 50)
    public String idStatus;

    @Column(name = "libelle", nullable = false, length = 200)
    public String libelle;

    public Status() {}

    public Status(String idStatus, String libelle) {
        this.idStatus = idStatus;
        this.libelle = libelle;
    }
}
