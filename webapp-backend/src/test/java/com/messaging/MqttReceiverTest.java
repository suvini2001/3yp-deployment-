package com.messaging;

import com.dto.sensor.EspCamDetectionDTO;
import com.dto.sensor.IRSensorDataDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.service.IRSensorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.support.MessageBuilder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MqttReceiverTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private IRSensorService irSensorService;

    private ObjectMapper objectMapper;
    private MqttReceiver receiver;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        receiver = new MqttReceiver(objectMapper, messagingTemplate, irSensorService);
    }

    // ───────── Topic-based routing tests ─────────

    @Test
    void crackTopic_broadcastsToCracksTopic() {
        String json = "{\"sensorId\":\"IR_Bottom\",\"deviceId\":\"esp-001\","
                + "\"crackDetected\":true,\"status\":\"CRITICAL\",\"timestamp\":\"2025-06-01T12:00:00Z\"}";

        Message<String> message = MessageBuilder.withPayload(json)
                .setHeader(MqttHeaders.RECEIVED_TOPIC, "railway/cracks")
                .build();

        receiver.handleIncomingMqttMessage(message);

        ArgumentCaptor<IRSensorDataDTO> captor = ArgumentCaptor.forClass(IRSensorDataDTO.class);
        verify(messagingTemplate).convertAndSend(eq("/topic/cracks"), captor.capture());
        assertEquals("IR_Bottom", captor.getValue().getSensorId());
        assertTrue(captor.getValue().isCrackDetected());
    }

    @Test
    void cameraTopic_broadcastsToCameraDetections() {
        String json = "{\"deviceId\":\"cam-001\",\"timestamp\":\"2025-06-01T12:00:00Z\","
                + "\"status\":\"active\",\"alert\":\"crack\",\"image_url\":\"https://s3.amazonaws.com/img.jpg\"}";

        Message<String> message = MessageBuilder.withPayload(json)
                .setHeader(MqttHeaders.RECEIVED_TOPIC, "device/esp32-cam/status")
                .build();

        receiver.handleIncomingMqttMessage(message);

        ArgumentCaptor<EspCamDetectionDTO> captor = ArgumentCaptor.forClass(EspCamDetectionDTO.class);
        verify(messagingTemplate).convertAndSend(eq("/topic/camera-detections"), captor.capture());
        assertEquals("cam-001", captor.getValue().getDeviceId());
        assertEquals("https://s3.amazonaws.com/img.jpg", captor.getValue().getImageUrl());
    }

    // ───────── Payload-based routing tests ─────────

    @Test
    void crackPayload_onUnknownTopic_routesAsCrack() {
        String json = "{\"sensorId\":\"IR_Top\",\"crackDetected\":true,\"timestamp\":\"ts\"}";

        Message<String> message = MessageBuilder.withPayload(json)
                .setHeader(MqttHeaders.RECEIVED_TOPIC, "some/other/topic")
                .build();

        receiver.handleIncomingMqttMessage(message);

        verify(messagingTemplate).convertAndSend(eq("/topic/cracks"), any(IRSensorDataDTO.class));
        verify(messagingTemplate, never()).convertAndSend(eq("/topic/camera-detections"), any(Object.class));
    }

    @Test
    void cameraPayload_onUnknownTopic_routesAsCamera() {
        // Payload with image_url but no crackDetected → should route to camera handler
        String json = "{\"deviceId\":\"cam-002\",\"image_url\":\"https://example.com/photo.jpg\","
                + "\"timestamp\":\"ts\",\"status\":\"ok\"}";

        Message<String> message = MessageBuilder.withPayload(json)
                .setHeader(MqttHeaders.RECEIVED_TOPIC, "some/random/topic")
                .build();

        receiver.handleIncomingMqttMessage(message);

        verify(messagingTemplate).convertAndSend(eq("/topic/camera-detections"), any(EspCamDetectionDTO.class));
    }

    // ───────── Error handling tests ─────────

    @Test
    void malformedJson_doesNotCrash() {
        String badJson = "this is not json at all";

        Message<String> message = MessageBuilder.withPayload(badJson)
                .setHeader(MqttHeaders.RECEIVED_TOPIC, "railway/cracks")
                .build();

        // Should not throw — errors are caught internally
        assertDoesNotThrow(() -> receiver.handleIncomingMqttMessage(message));

        verifyNoInteractions(messagingTemplate);
    }

    @Test
    void unknownTopicAndPayload_ignored() {
        // No crack or camera fields → should be ignored
        String json = "{\"temperature\":25.5,\"humidity\":60}";

        Message<String> message = MessageBuilder.withPayload(json)
                .setHeader(MqttHeaders.RECEIVED_TOPIC, "weather/station")
                .build();

        receiver.handleIncomingMqttMessage(message);

        verifyNoInteractions(messagingTemplate);
    }
}
