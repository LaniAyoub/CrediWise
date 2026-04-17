package org.acme.service;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class PasswordServiceTest {

    @Inject
    PasswordService passwordService;

    @Test
    void hashAndVerify_shouldWork() {
        String plain = "MySuperSecret123!";
        String hashed = passwordService.hash(plain);

        assertNotEquals(plain, hashed);
        assertTrue(passwordService.verify(plain, hashed));
        assertFalse(passwordService.verify("wrong", hashed));
    }
}