package org.acme.service;

import io.quarkus.elytron.security.common.BcryptUtil;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class PasswordService {

    // Hache le password (à appeler à l'inscription)
    public String hash(String plainPassword) {
        return BcryptUtil.bcryptHash(plainPassword);
    }

    // Vérifie password + hash (à appeler à la connexion)
    public boolean verify(String plainPassword, String hashedPassword) {
        return BcryptUtil.matches(plainPassword, hashedPassword);
    }
}