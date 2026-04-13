package org.acme.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;

@Entity
@Table(name = "product")
public class Product extends PanacheEntityBase {

    @Id
    @Column(name = "product_id", length = 50)
    public String productId;

    @Column(name = "type", length = 50)
    public String type;

    @Column(name = "name", nullable = false, length = 200)
    public String name;

    public Product() {}

    public Product(String productId, String type, String name) {
        this.productId = productId;
        this.type = type;
        this.name = name;
    }
}
