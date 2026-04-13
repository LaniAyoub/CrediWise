package org.acme.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "guarantors")
public class Guarantor extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demande_id", nullable = false)
    public Demande demande;

    @Column(name = "amplitude_id", length = 100)
    public String amplitudeId;

    @Column(name = "name", length = 200)
    public String name;

    @Column(name = "client_relationship", length = 100)
    public String clientRelationship;
}
