package com.config;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import static org.junit.jupiter.api.Assertions.*;

class DynamoDbConfigTest {

    @Test
    void testClientsCreation() {
        DynamoDbConfig config = new DynamoDbConfig();
        ReflectionTestUtils.setField(config, "region", "eu-north-1");
        ReflectionTestUtils.setField(config, "accessKey", "dummyAccessKey");
        ReflectionTestUtils.setField(config, "secretKey", "dummySecretKey");

        DynamoDbClient client = config.dynamoDbClient();
        assertNotNull(client);

        DynamoDbEnhancedClient enhancedClient = config.dynamoDbEnhancedClient(client);
        assertNotNull(enhancedClient);
    }
}
