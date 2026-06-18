package com.mapper;

import com.dto.sensor.IRSensorDataDTO;
import com.dto.sensor.LocationDTO;
import com.model.irsensorData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class IRSensorMapperTest {

    private IRSensorMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new IRSensorMapper();
    }

    // ───────── toDTO tests ─────────

    @Test
    void toDTO_nullEntity_returnsNull() {
        assertNull(mapper.toDTO(null));
    }

    @Test
    void toDTO_mapsAllFields() {
        irsensorData entity = new irsensorData();
        entity.setSensorId("IR_Bottom");
        entity.setTimestamp("2025-06-01T12:00:00Z");
        entity.setDeviceId("esp-001");
        entity.setCrackDetected(true);
        entity.setStatus("CRITICAL");
        entity.setImageUrl("https://s3.amazonaws.com/photo.jpg");
        entity.setLatitude(7.2906);
        entity.setLongitude(80.6337);

        IRSensorDataDTO dto = mapper.toDTO(entity);

        assertNotNull(dto);
        assertEquals("IR_Bottom", dto.getSensorId());
        assertEquals("2025-06-01T12:00:00Z", dto.getTimestamp());
        assertEquals("esp-001", dto.getDeviceId());
        assertTrue(dto.isCrackDetected());
        assertEquals("CRITICAL", dto.getStatus());
        assertEquals("https://s3.amazonaws.com/photo.jpg", dto.getImageUrl());
        assertNotNull(dto.getLocation());
        assertEquals(7.2906, dto.getLocation().getLat(), 0.0001);
        assertEquals(80.6337, dto.getLocation().getLng(), 0.0001);
    }

    @Test
    void toDTO_zeroLatLng_stillMapsLocation() {
        irsensorData entity = new irsensorData();
        entity.setSensorId("S1");
        entity.setTimestamp("ts");
        entity.setDeviceId("D1");
        entity.setLatitude(0.0);
        entity.setLongitude(0.0);

        IRSensorDataDTO dto = mapper.toDTO(entity);

        assertNotNull(dto.getLocation());
        assertEquals(0.0, dto.getLocation().getLat());
        assertEquals(0.0, dto.getLocation().getLng());
    }

    // ───────── toEntity tests ─────────

    @Test
    void toEntity_nullDto_returnsNull() {
        assertNull(mapper.toEntity(null));
    }

    @Test
    void toEntity_mapsAllFields() {
        LocationDTO loc = new LocationDTO(7.25, 80.59);
        IRSensorDataDTO dto = new IRSensorDataDTO("IR_Top", "2025-07-01T08:00:00Z", "esp-002", true, "WARNING", loc);
        dto.setImageUrl("https://example.com/img.png");

        irsensorData entity = mapper.toEntity(dto);

        assertNotNull(entity);
        assertEquals("IR_Top", entity.getSensorId());
        assertEquals("2025-07-01T08:00:00Z", entity.getTimestamp());
        assertEquals("esp-002", entity.getDeviceId());
        assertTrue(entity.isCrackDetected());
        assertEquals("WARNING", entity.getStatus());
        assertEquals("https://example.com/img.png", entity.getImageUrl());
        assertEquals(7.25, entity.getLatitude(), 0.0001);
        assertEquals(80.59, entity.getLongitude(), 0.0001);
    }

    @Test
    void toEntity_nullLocation_doesNotCrash() {
        IRSensorDataDTO dto = new IRSensorDataDTO("S1", "ts", "D1", false, "OK");
        // location is null by default

        irsensorData entity = mapper.toEntity(dto);

        assertNotNull(entity);
        assertEquals("S1", entity.getSensorId());
        assertEquals(0.0, entity.getLatitude());
        assertEquals(0.0, entity.getLongitude());
    }

    // ───────── round-trip test ─────────

    @Test
    void roundTrip_entityToDtoToEntity_preservesData() {
        irsensorData original = new irsensorData();
        original.setSensorId("IR_Side");
        original.setTimestamp("2025-08-15T16:30:00Z");
        original.setDeviceId("esp-003");
        original.setCrackDetected(true);
        original.setStatus("SEVERE");
        original.setImageUrl("https://bucket.s3.amazonaws.com/crack.jpg");
        original.setLatitude(6.927);
        original.setLongitude(79.861);

        IRSensorDataDTO dto = mapper.toDTO(original);
        irsensorData restored = mapper.toEntity(dto);

        assertEquals(original.getSensorId(), restored.getSensorId());
        assertEquals(original.getTimestamp(), restored.getTimestamp());
        assertEquals(original.getDeviceId(), restored.getDeviceId());
        assertEquals(original.isCrackDetected(), restored.isCrackDetected());
        assertEquals(original.getStatus(), restored.getStatus());
        assertEquals(original.getImageUrl(), restored.getImageUrl());
        assertEquals(original.getLatitude(), restored.getLatitude(), 0.0001);
        assertEquals(original.getLongitude(), restored.getLongitude(), 0.0001);
    }
}
