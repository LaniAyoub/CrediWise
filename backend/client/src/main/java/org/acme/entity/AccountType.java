package org.acme.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * Maps to TYPE_DE_COMPTE table.
 * 1=Current, 2=Saving, 3=Term Deposit, 4=Other
 */
@Entity
@Table(name = "account_type")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(of = "id", callSuper = false)
@ToString
public class AccountType extends PanacheEntityBase {

    @Id
    @Column(name = "id_account_type")
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String libelle;
}
