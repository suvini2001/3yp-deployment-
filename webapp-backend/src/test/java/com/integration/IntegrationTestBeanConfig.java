package com.integration;


import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.integration.core.MessageProducer;
import org.springframework.integration.mqtt.core.MqttPahoClientFactory;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.support.ExecutorSubscribableChannel;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

/**
 * Replaces real AWS and MQTT beans with Mockito stubs for the
 * 'integration' profile so no network calls are made during tests.
 *
 * @Primary ensures these beans take precedence over the real
 * beans registered in DynamoDbConfig and MqttConfig.
 */
@TestConfiguration
public class IntegrationTestBeanConfig {

    // ── DynamoDB stubs ────────────────────────────────────────────────────────

    /**
     * Replaces the real {@link DynamoDbConfig#dynamoDbClient()} bean.
     * Individual tests configure behaviour via Mockito.when().
     */
    @Bean
    @Primary
    public DynamoDbClient dynamoDbClient() {
        return Mockito.mock(DynamoDbClient.class);
    }

    /**
     * Replaces the real {@link DynamoDbConfig#dynamoDbEnhancedClient(DynamoDbClient)} bean.
     */
    @Bean
    @Primary
    public DynamoDbEnhancedClient dynamoDbEnhancedClient() {
        return Mockito.mock(DynamoDbEnhancedClient.class);
    }

    // ── MQTT stubs ────────────────────────────────────────────────────────────

    /**
     * Replaces {@link MqttConfig#mqttInputChannel()} with a no-op channel
     * so Spring Integration does not try to connect to a real broker.
     */
    @Bean
    @Primary
    public MessageChannel mqttInputChannel() {
        return new ExecutorSubscribableChannel();
    }

    /**
     * Replaces {@link MqttConfig#inbound()} with a stub that never starts.
     */
    @Bean
    @Primary
    public MessageProducer inbound() {
        return Mockito.mock(MessageProducer.class);
    }

    /**
     * Replaces {@link MqttConfig#mqttClientFactory()} to avoid SSL cert loading.
     */
    @Bean
    @Primary
    public MqttPahoClientFactory mqttClientFactory() {
        return Mockito.mock(MqttPahoClientFactory.class);
    }
}
