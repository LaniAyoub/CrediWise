package org.acme.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "guarantees")
public class Guarantee extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "demande_id", nullable = false)
    public Demande demande;

    @Column(name = "owner", length = 200)
    public String owner;

    @Column(name = "type", length = 100)
    public String type;

    @Column(name = "estimated_value", precision = 15, scale = 3)
    public BigDecimal estimatedValue;
}
