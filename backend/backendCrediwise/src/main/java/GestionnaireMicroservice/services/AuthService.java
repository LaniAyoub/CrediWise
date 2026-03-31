package GestionnaireMicroservice.services;

import GestionnaireMicroservice.entities.Gestionnaires;
import GestionnaireMicroservice.repositories.GestionnaireRepository;
import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Duration;
import java.util.Set;

@ApplicationScoped
public class AuthService {

    @Inject
    GestionnaireRepository repository;

    @Inject
    PasswordService passwordService;

    @ConfigProperty(name = "mp.jwt.verify.issuer")
    String issuer;

    public String login(String email, String password) {
        // 1. Chercher le gestionnaire par email
        Gestionnaires g = repository.findByEmail(email).orElse(null);

        if (g == null) {
            throw new RuntimeException("Email ou password incorrect");
        }

        // 2. Vérifier le password avec BCrypt
        if (!passwordService.verify(password, g.password)) {
            throw new RuntimeException("Email ou password incorrect");
        }

        // 3. Générer le token JWT
        return Jwt.issuer(issuer)
                .subject(g.email)
                .groups(Set.of(g.role.name()))
                .claim("cin", g.cin)
                .claim("agenceId", g.agence.idBranch)
                .claim("firstName", g.firstName)
                .expiresIn(Duration.ofHours(8))
                .sign();
    }
}