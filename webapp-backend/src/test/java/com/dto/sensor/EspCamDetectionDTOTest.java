package com.dto.sensor;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class EspCamDetectionDTOTest {

    @Test
    void defaultConstructor_allNull() {
        EspCamDetectionDTO dto = new EspCamDetectionDTO();

        assertNull(dto.getDeviceId());
        assertNull(dto.getTimestamp());
        assertNull(dto.getStatus());
        assertNull(dto.getAlert());
        assertNull(dto.getImageUrl());
    }

    @Test
    void fullConstructor_setsAllFields() {
        EspCamDetectionDTO dto = new EspCamDetectionDTO(
                "cam-001", "2025-06-01T12:00:00Z", "active", "crack_detected",
                "https://s3.amazonaws.com/img.jpg");

        assertEquals("cam-001", dto.getDeviceId());
        assertEquals("2025-06-01T12:00:00Z", dto.getTimestamp());
        assertEquals("active", dto.getStatus());
        assertEquals("crack_detected", dto.getAlert());
        assertEquals("https://s3.amazonaws.com/img.jpg", dto.getImageUrl());
    }

    @Test
    void settersAndGetters_roundTrip() {
        EspCamDetectionDTO dto = new EspCamDetectionDTO();

        dto.setDeviceId("cam-002");
        dto.setTimestamp("2025-07-15T08:30:00Z");
        dto.setStatus("idle");
        dto.setAlert("none");
        dto.setImageUrl("https://example.com/photo.png");

        assertEquals("cam-002", dto.getDeviceId());
        assertEquals("2025-07-15T08:30:00Z", dto.getTimestamp());
        assertEquals("idle", dto.getStatus());
        assertEquals("none", dto.getAlert());
        assertEquals("https://example.com/photo.png", dto.getImageUrl());
    }

    @Test
    void toString_containsAllFields() {
        EspCamDetectionDTO dto = new EspCamDetectionDTO(
                "cam-001", "ts", "active", "alert", "url");

        String result = dto.toString();

        assertTrue(result.contains("cam-001"));
        assertTrue(result.contains("ts"));
        assertTrue(result.contains("active"));
        assertTrue(result.contains("alert"));
        assertTrue(result.contains("url"));
    }
}
