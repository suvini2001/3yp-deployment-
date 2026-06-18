
package com.messaging;

import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import com.dto.sensor.EspCamDetectionDTO;
import com.dto.sensor.IRSensorDataDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.service.IRSensorService;

@Component
public class MqttReceiver {

    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate messagingTemplate; // The WebSocket Broadcaster
    private final IRSensorService irSensorService;

    // Spring injects both the Mapper and the WebSocket Template
    public MqttReceiver(ObjectMapper objectMapper,
            SimpMessagingTemplate messagingTemplate,
            IRSensorService irSensorService) {
        this.objectMapper = objectMapper;
        this.messagingTemplate = messagingTemplate;
        this.irSensorService = irSensorService;
    }

    @ServiceActivator(inputChannel = "mqttInputChannel")
    public void handleIncomingMqttMessage(Message<String> message) {
        String rawJsonPayload = message.getPayload();
        String mqttTopic = message.getHeaders().get(MqttHeaders.RECEIVED_TOPIC, String.class);

        try {
            JsonNode payloadNode = objectMapper.readTree(rawJsonPayload);
            boolean crackTopic = "railway/cracks".equals(mqttTopic);
            boolean cameraTopic = mqttTopic != null && mqttTopic.contains("device/esp32-cam/status");

            if (isHeartbeatPayload(payloadNode)) {
                // Heartbeats must be checked BEFORE isCrackPayload because they also
                // contain crack_detected=false which could match the crack check.
                handleHeartbeatMessage(rawJsonPayload);
            } else if (crackTopic || isCrackPayload(payloadNode)) {
                handleIRSensorMessage(rawJsonPayload);
            } else if (cameraTopic || isCameraPayload(payloadNode)) {
                handleCameraMessage(rawJsonPayload);
            } else {
                System.err.println("Ignoring MQTT message from unsupported topic: " + mqttTopic);
            }

        } catch (Exception e) {
            System.err.println("Failed to process MQTT message: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /** Detects ESP32 heartbeat pings (status=NOMINAL_HEARTBEAT or crack_detected=false without a crack alert). */
    private boolean isHeartbeatPayload(JsonNode node) {
        JsonNode statusNode = node.get("status");
        if (statusNode != null && "NOMINAL_HEARTBEAT".equals(statusNode.asText())) {
            return true;
        }
        // Heartbeats set crack_detected=false (snake_case). Crack alerts always set
        // crackDetected=true (camelCase) as well, so we can safely distinguish them.
        JsonNode snakeCrack = node.get("crack_detected");
        JsonNode camelCrack = node.get("crackDetected");
        boolean hasCrackDetectedFalse = snakeCrack != null && !snakeCrack.asBoolean();
        boolean hasNoCamelCase       = camelCrack == null || !camelCrack.asBoolean();
        return hasCrackDetectedFalse && hasNoCamelCase;
    }

    private boolean isCrackPayload(JsonNode node) {
        // Accept both camelCase (crackDetected) and snake_case (crack_detected)
        return node.has("crackDetected") || node.has("crack_detected") || node.has("minValue");
    }

    private boolean isCameraPayload(JsonNode node) {
        return node.has("image_url") || node.has("imageUrl");
    }

    /*
     * Handles IR Sensor crack detection data
     */
    private void handleIRSensorMessage(String rawJsonPayload) throws Exception {
        // 1. Convert MQTT JSON to Java DTO
        IRSensorDataDTO liveCrackData = objectMapper.readValue(rawJsonPayload, IRSensorDataDTO.class);

        // 2. Check if conversion was successful (null safety)
        if (liveCrackData == null) {
            System.err.println("Failed to parse MQTT payload into IRSensorDataDTO");
            return;
        }

        // 3. BROADCAST TO REACT: Push the DTO down the WebSocket to anyone listening
        messagingTemplate.convertAndSend("/topic/cracks", liveCrackData);

        System.out.println("Broadcasted live crack data to Web UI: " + liveCrackData.getSensorId());
    }

    /*
     * Handles ESP32 heartbeat pings — device alive, no crack detected.
     * Broadcasts on /topic/cracks so the frontend heartbeat table can display them.
     */
    private void handleHeartbeatMessage(String rawJsonPayload) throws Exception {
        // Re-use IRSensorDataDTO — it already has all the fields we need.
        // Jackson maps crack_detected → crackDetected via the setter automatically.
        IRSensorDataDTO heartbeat = objectMapper.readValue(rawJsonPayload, IRSensorDataDTO.class);

        if (heartbeat == null) {
            System.err.println("Failed to parse heartbeat payload.");
            return;
        }

        // Ensure status is set even if Jackson missed it
        if (heartbeat.getStatus() == null || heartbeat.getStatus().isEmpty()) {
            heartbeat.setStatus("NOMINAL_HEARTBEAT");
        }

        // Broadcast on the same /topic/cracks channel — the React frontend
        // filters by crackDetected=false into the heartbeats table.
        messagingTemplate.convertAndSend("/topic/cracks", heartbeat);

        System.out.println("[HEARTBEAT] Broadcasted heartbeat to Web UI: device=" + heartbeat.getDeviceId()
                + " status=" + heartbeat.getStatus());
    }

    /*
     * 
     * Handles ESP32-
     * CAM photo
     * upload confirmation
     * and imageUrl parsing
     */

    private void handleCameraMessage(String rawJsonPayload) throws Exception {
        // 1. Convert MQTT JSON to Camera Detection DTO using the new EspCamDetectionDTO
        EspCamDetectionDTO cameraData = objectMapper.readValue(rawJsonPayload, EspCamDetectionDTO.class);

        // 2. Null safety check
        if (cameraData == null) {
            System.err.println("Failed to parse MQTT payload into EspCamDetectionDTO");
            return;
        }

        // 3. Extract and validate imageUrl (critical field from ESP32-CAM)
        String imageUrl = cameraData.getImageUrl();
        if (imageUrl != null && !imageUrl.isEmpty()) {
            System.out.println("Broadcasted Photo URL: " + imageUrl);
        }

        // 4. Optional: Save to repository (when created)
        // espCamRepository.save(cameraData);

        // 5. BROADCAST TO REACT: Send full camera detection object with image URL to
        // dashboard
        messagingTemplate.convertAndSend("/topic/camera-detections", cameraData);

        System.out.println("Broadcasted camera detection to Web UI: " + cameraData.getDeviceId());
    }
}/*
  * ===========================================================
  * MQTT RECEIVER - EXPLANATION
  * ===========================================================
  * 
  * PURPOSE:
  * --------
  * This class acts as a bridge between AWS IoT (MQTT messages)
  * and the frontend (React UI via WebSocket).
  * 
  * It listens to incoming MQTT messages from the internal
  * Spring Integration channel, routes them based on topic,
  * and broadcasts processed data to connected WebSocket clients
  * in real-time.
  * 
  * -----------------------------------------------------------
  * DATA FLOW (IR SENSOR):
  * -----------------------------------------------------------
  * ESP32 IR Sensor Device
  * ↓ (publishes MQTT: railway/cracks)
  * AWS IoT Core
  * ↓
  * MqttConfig (MQTT Adapter)
  * ↓
  * mqttInputChannel (Spring Message Channel)
  * ↓
  * MqttReceiver.handleIncomingMqttMessage()
  * ↓
  * handleIRSensorMessage() → /topic/cracks
  * ↓
  * React Frontend (Live UI Updates)
  * 
  * -----------------------------------------------------------
  * DATA FLOW (CAMERA):
  * -----------------------------------------------------------
  * ESP32-CAM Device
  * ↓ (publishes MQTT: device/esp32-cam/status)
  * AWS IoT Core
  * ↓
  * MqttConfig (MQTT Adapter)
  * ↓
  * mqttInputChannel (Spring Message Channel)
  * ↓
  * MqttReceiver.handleIncomingMqttMessage()
  * ↓
  * handleCameraMessage() → /topic/camera-detections
  * ↓
  * React Frontend (Photo + Alert Display)
  * 
  * -----------------------------------------------------------
  * KEY COMPONENTS:
  * -----------------------------------------------------------
  * 
  * 1. @Component
  * - Marks this class as a Spring-managed bean.
  * 
  * 2. @ServiceActivator(inputChannel = "mqttInputChannel")
  * - Listens for messages arriving from MQTT.
  * - Automatically triggers the method when a message arrives.
  * 
  * 3. ObjectMapper
  * - Converts incoming JSON string into Java object (DTO).
  * 
  * 4. SimpMessagingTemplate
  * - Sends messages from backend to frontend via WebSocket.
  * 
  * -----------------------------------------------------------
  * TOPICS HANDLED:
  * -----------------------------------------------------------
  * 
  * 1. railway/cracks (IR Sensor Data)
  * - Format: IRSensorDataDTO
  * - Contains: sensorId, deviceId, timestamp, crackDetected, status
  * - WebSocket Destination: /topic/cracks
  * 
  * 2. device/esp32-cam/status (Camera Detection)
  * - Format: EspCamDetectionDTO
  * - Contains: deviceId, timestamp, status, alert, imageUrl
  * - WebSocket Destination: /topic/camera-detections
  * 
  * -----------------------------------------------------------
  * METHOD LOGIC:
  * -----------------------------------------------------------
  * 
  * handleIncomingMqttMessage(Message<String> message)
  * 
  * Step 1: Extract raw JSON payload and topic from MQTT message
  * Step 2: Route to appropriate handler based on topic
  * - If topic contains "esp32-cam/status" → handleCameraMessage()
  * - If topic contains "railway/cracks" → handleIRSensorMessage()
  * - Default: handleIRSensorMessage()
  * Step 3: Handler converts JSON to appropriate DTO
  * Step 4: Handler broadcasts to WebSocket (/topic/cracks or
  * /topic/camera-detections)
  * Step 5: Log success or error
  * 
  * handleCameraMessage(String rawJsonPayload)
  * 
  * Step 1: Parse JSON into EspCamDetectionDTO using ObjectMapper
  * Step 2: Extract and validate imageUrl
  * Step 3: Optional - save to repository (when implemented)
  * Step 4: Broadcast detection to frontend with imageUrl
  * 
  * -----------------------------------------------------------
  * IMPORTANT NOTES:
  * -----------------------------------------------------------
  * 
  * - WebSocket topics must match frontend subscriptions.
  * - DTO structure must match incoming JSON format.
  * - If JSON format changes, parsing will fail.
  * - Camera imageUrl is parsed and made available to React.
  * - Error handling prevents crashes on malformed JSON.
  * 
  * -----------------------------------------------------------
  * SUMMARY:
  * -----------------------------------------------------------
  * [4/26/2026 1:38 AM] Chamodii: * This class enables real-time communication
  * by:
  * ✔️ Receiving MQTT messages from AWS IoT
  * ✔️ Routing messages based on topic
  * ✔️ Converting them into Java objects (DTOs)
  * ✔️ Broadcasting them to the frontend via WebSocket
  * ✔️ Extracting camera image URLs for display
  * 
  * It is a critical part of the real-time IoT pipeline.
  * 
  * ===========================================================
  */
