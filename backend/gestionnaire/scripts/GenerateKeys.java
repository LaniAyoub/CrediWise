import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.util.Base64;

public class GenerateKeys {
    public static void main(String[] args) throws Exception {
        // Generate RSA key pair
        KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
        keyPairGenerator.initialize(2048);
        KeyPair keyPair = keyPairGenerator.generateKeyPair();
        
        PrivateKey privateKey = keyPair.getPrivate();
        PublicKey publicKey = keyPair.getPublic();
        
        // Encode private key
        String privateKeyPem = "-----BEGIN PRIVATE KEY-----\n" +
            Base64.getMimeEncoder().encodeToString(privateKey.getEncoded()) +
            "\n-----END PRIVATE KEY-----";
        
        // Encode public key
        String publicKeyPem = "-----BEGIN PUBLIC KEY-----\n" +
            Base64.getMimeEncoder().encodeToString(publicKey.getEncoded()) +
            "\n-----END PUBLIC KEY-----";
        
        // Write to files
        Files.write(Paths.get("src/main/resources/privateKey.pem"), privateKeyPem.getBytes());
        Files.write(Paths.get("src/main/resources/publicKey.pem"), publicKeyPem.getBytes());
        
        System.out.println("Keys generated successfully!");
    }
}
