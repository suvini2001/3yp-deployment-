package com.config;

import org.junit.jupiter.api.Test;
import org.springframework.integration.mqtt.core.MqttPahoClientFactory;
import org.springframework.messaging.MessageChannel;
import org.springframework.integration.core.MessageProducer;
import org.springframework.test.util.ReflectionTestUtils;
import static org.junit.jupiter.api.Assertions.*;

class MqttConfigTest {

    @Test
    void testMqttBeansCreation() {
        MqttConfig config = new MqttConfig();
        ReflectionTestUtils.setField(config, "brokerUrl", "ssl://a141eqbs4ue48l-ats.iot.eu-north-1.amazonaws.com:8883");
        ReflectionTestUtils.setField(config, "clientId", "client01-backend");
        ReflectionTestUtils.setField(config, "topicFilter", "$share/raid-backend-group/railway/cracks");
        ReflectionTestUtils.setField(config, "autoStartup", false);

        MqttPahoClientFactory factory = config.mqttClientFactory();
        assertNotNull(factory);
        assertNotNull(factory.getConnectionOptions());
        assertEquals("ssl://a141eqbs4ue48l-ats.iot.eu-north-1.amazonaws.com:8883", factory.getConnectionOptions().getServerURIs()[0]);
        assertTrue(factory.getConnectionOptions().isCleanSession());
        assertEquals(60, factory.getConnectionOptions().getKeepAliveInterval());

        MessageChannel channel = config.mqttInputChannel();
        assertNotNull(channel);

        MessageProducer inbound = config.inbound();
        assertNotNull(inbound);
    }
}
