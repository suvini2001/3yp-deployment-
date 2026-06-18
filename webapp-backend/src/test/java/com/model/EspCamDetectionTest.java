package com.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class EspCamDetectionTest {

    @Test
    void defaultConstructor_allNull() {
        EspCamDetection detection = new EspCamDetection();

        assertNull(detection.getSensorId());
        assertNull(detection.getTimestamp());
        assertNull(detection.getImageUrl());
        assertNull(detection.getStatus());
    }

    @Test
    void settersAndGetters_roundTrip() {
        EspCamDetection detection = new EspCamDetection();

        detection.setSensorId("CAM_Front");
        detection.setTimestamp("2025-06-01T12:00:00Z");
        detection.setImageUrl("https://s3.amazonaws.com/img.jpg");
        detection.setStatus("crack_confirmed");

        assertEquals("CAM_Front", detection.getSensorId());
        assertEquals("2025-06-01T12:00:00Z", detection.getTimestamp());
        assertEquals("https://s3.amazonaws.com/img.jpg", detection.getImageUrl());
        assertEquals("crack_confirmed", detection.getStatus());
    }
}
