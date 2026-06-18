package com.integration;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

/**
 * Base class for all integration tests.
 *
 * Boots the full Spring application context on a random port using the
 * 'integration' profile, which loads application-integration.properties
 * and replaces real AWS beans with Mockito stubs via
 * IntegrationTestBeanConfig.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("integration")
@TestPropertySource(locations = "classpath:application-integration.properties")
public abstract class BaseIntegrationTest {

    @LocalServerPort
    protected int port;

    protected String baseUrl() {
        return "http://localhost:" + port;
    }
}
