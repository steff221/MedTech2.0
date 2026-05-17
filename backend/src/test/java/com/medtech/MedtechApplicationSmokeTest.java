package com.medtech;

import org.junit.jupiter.api.Test;

/**
 * Minimal sanity test: confirms the test JVM can load the codebase.
 * A full {@code @SpringBootTest} context load requires a running PostgreSQL
 * and is intentionally deferred to integration-test profile in Phase 4.
 */
class MedtechApplicationSmokeTest {

    @Test
    void mainClassExists() {
        // simply ensure the class is loadable
        assert MedtechApplication.class.getName().equals("com.medtech.MedtechApplication");
    }
}
