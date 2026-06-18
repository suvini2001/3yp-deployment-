package com.dto.sensor;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class IRSensorDataDTOTest {

    @Test
    void defaultConstructor_setsDefaults() {
        IRSensorDataDTO dto = new IRSensorDataDTO();

        assertNull(dto.getSensorId());
        assertNull(dto.getTimestamp());
        assertNull(dto.getDeviceId());
        assertFalse(dto.isCrackDetected());
        assertNull(dto.getStatus());
        assertEquals(0.0, dto.getSeverity());
        assertNull(dto.getImageUrl());
        assertNull(dto.getLocation());
    }

    @Test
    void fiveArgConstructor_setsFields() {
        IRSensorDataDTO dto = new IRSensorDataDTO("S1", "2025-01-01T00:00:00Z", "D1", true, "CRITICAL");

        assertEquals("S1", dto.getSensorId());
        assertEquals("2025-01-01T00:00:00Z", dto.getTimestamp());
        assertEquals("D1", dto.getDeviceId());
        assertTrue(dto.isCrackDetected());
        assertEquals("CRITICAL", dto.getStatus());
        assertNull(dto.getLocation());
    }

    @Test
    void sixArgConstructor_includesLocation() {
        LocationDTO loc = new LocationDTO(7.25, 80.59);
        IRSensorDataDTO dto = new IRSensorDataDTO("S1", "ts", "D1", true, "OK", loc);

        assertSame(loc, dto.getLocation());
        assertEquals(7.25, dto.getLocation().getLat());
    }

    @Test
    void sevenArgConstructor_includesSeverity() {
        LocationDTO loc = new LocationDTO(1.0, 2.0);
        IRSensorDataDTO dto = new IRSensorDataDTO("S1", "ts", "D1", true, "OK", 0.85, loc);

        assertEquals(0.85, dto.getSeverity());
        assertSame(loc, dto.getLocation());
    }

    @Test
    void settersAndGetters_roundTrip() {
        IRSensorDataDTO dto = new IRSensorDataDTO();

        dto.setSensorId("IR_Bottom");
        dto.setTimestamp("2025-06-01T12:00:00Z");
        dto.setDeviceId("esp-001");
        dto.setCrackDetected(true);
        dto.setStatus("WARNING");
        dto.setSeverity(0.72);
        dto.setImageUrl("https://s3.amazonaws.com/photo.jpg");
        dto.setLocation(new LocationDTO(6.9, 79.8));

        assertEquals("IR_Bottom", dto.getSensorId());
        assertEquals("2025-06-01T12:00:00Z", dto.getTimestamp());
        assertEquals("esp-001", dto.getDeviceId());
        assertTrue(dto.isCrackDetected());
        assertEquals("WARNING", dto.getStatus());
        assertEquals(0.72, dto.getSeverity());
        assertEquals("https://s3.amazonaws.com/photo.jpg", dto.getImageUrl());
        assertEquals(6.9, dto.getLocation().getLat());
        assertEquals(79.8, dto.getLocation().getLng());
    }
}
