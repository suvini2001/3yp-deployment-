package com.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class irsensorDataTest {

    @Test
    void defaultValues() {
        irsensorData data = new irsensorData();

        assertNull(data.getSensorId());
        assertNull(data.getTimestamp());
        assertNull(data.getDeviceId());
        assertFalse(data.isCrackDetected());
        assertNull(data.getStatus());
        assertNull(data.getImageUrl());
        assertEquals(0, data.getUptime());
        assertEquals(0.0, data.getLatitude());
        assertEquals(0.0, data.getLongitude());
    }

    @Test
    void settersAndGetters_roundTrip() {
        irsensorData data = new irsensorData();

        data.setSensorId("IR_Bottom");
        data.setTimestamp("2025-06-01T12:00:00Z");
        data.setDeviceId("esp-001");
        data.setCrackDetected(true);
        data.setStatus("CRITICAL");
        data.setImageUrl("https://s3.amazonaws.com/photo.jpg");
        data.setUptime(3600);
        data.setLatitude(7.2906);
        data.setLongitude(80.6337);

        assertEquals("IR_Bottom", data.getSensorId());
        assertEquals("2025-06-01T12:00:00Z", data.getTimestamp());
        assertEquals("esp-001", data.getDeviceId());
        assertTrue(data.isCrackDetected());
        assertEquals("CRITICAL", data.getStatus());
        assertEquals("https://s3.amazonaws.com/photo.jpg", data.getImageUrl());
        assertEquals(3600, data.getUptime());
        assertEquals(7.2906, data.getLatitude(), 0.0001);
        assertEquals(80.6337, data.getLongitude(), 0.0001);
    }

    @Test
    void crackDetected_defaultIsFalse() {
        irsensorData data = new irsensorData();
        assertFalse(data.isCrackDetected());

        data.setCrackDetected(true);
        assertTrue(data.isCrackDetected());

        data.setCrackDetected(false);
        assertFalse(data.isCrackDetected());
    }
}
