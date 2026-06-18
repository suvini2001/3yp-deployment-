package com.service;

import com.dto.sensor.IRSensorDataDTO;
import com.dto.sensor.LocationDTO;
import com.mapper.IRSensorMapper;
import com.model.irsensorData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CrackEventHandlerTest {

    private CrackEventHandler handler;

    @BeforeEach
    void setUp() {
        handler = new CrackEventHandler();
    }

    // ───────── validateAndLogConfirmedCrack tests ─────────

    @Test
    void validate_nullEvent_returnsFalse() {
        assertFalse(handler.validateAndLogConfirmedCrack(null));
    }

    @Test
    void validate_crackNotDetected_returnsFalse() {
        IRSensorDataDTO dto = new IRSensorDataDTO("S1", "ts", "D1", false, "OK",
                new LocationDTO(7.25, 80.59));
        assertFalse(handler.validateAndLogConfirmedCrack(dto));
    }

    @Test
    void validate_nullLocation_returnsFalse() {
        IRSensorDataDTO dto = new IRSensorDataDTO("S1", "ts", "D1", true, "CRITICAL");
        // location is null
        assertFalse(handler.validateAndLogConfirmedCrack(dto));
    }

    @Test
    void validate_nullLatInLocation_returnsFalse() {
        IRSensorDataDTO dto = new IRSensorDataDTO();
        dto.setSensorId("S1");
        dto.setTimestamp("ts");
        dto.setCrackDetected(true);
        LocationDTO loc = new LocationDTO();
        // lat and lng default to 0.0 (primitive double)
        dto.setLocation(loc);

        // 0,0 GPS is treated as invalid
        assertFalse(handler.validateAndLogConfirmedCrack(dto));
    }

    @Test
    void validate_zeroGps_returnsFalse() {
        IRSensorDataDTO dto = new IRSensorDataDTO("S1", "ts", "D1", true, "CRITICAL",
                new LocationDTO(0.0, 0.0));
        assertFalse(handler.validateAndLogConfirmedCrack(dto));
    }

    @Test
    void validate_validCrackEvent_returnsTrue() {
        IRSensorDataDTO dto = new IRSensorDataDTO("S1", "ts", "D1", true, "CRITICAL",
                new LocationDTO(7.2906, 80.6337));
        assertTrue(handler.validateAndLogConfirmedCrack(dto));
    }

    @Test
    void validate_negativeCoordinates_returnsTrue() {
        // Negative coordinates are valid (e.g., southern or western hemisphere)
        IRSensorDataDTO dto = new IRSensorDataDTO("S1", "ts", "D1", true, "WARNING",
                new LocationDTO(-33.8688, 151.2093));
        assertTrue(handler.validateAndLogConfirmedCrack(dto));
    }

    @Test
    void validate_onlyLatZero_returnsFalse() {
        // Both must be non-zero
        IRSensorDataDTO dto = new IRSensorDataDTO("S1", "ts", "D1", true, "CRITICAL",
                new LocationDTO(0.0, 80.0));
        // 0.0 lat AND 0.0 lng check uses &&, so only lat=0 should pass
        assertTrue(handler.validateAndLogConfirmedCrack(dto));
    }

    // ───────── toEntityForPersistence tests ─────────

    @Test
    void toEntity_validEvent_returnsEntityWithLatLng() {
        IRSensorMapper mapper = new IRSensorMapper();
        LocationDTO loc = new LocationDTO(7.2906, 80.6337);
        IRSensorDataDTO dto = new IRSensorDataDTO("IR_Bottom", "2025-06-01T12:00:00Z", "esp-001", true, "CRITICAL", loc);

        irsensorData entity = handler.toEntityForPersistence(dto, mapper);

        assertNotNull(entity);
        assertEquals("IR_Bottom", entity.getSensorId());
        assertEquals(7.2906, entity.getLatitude(), 0.0001);
        assertEquals(80.6337, entity.getLongitude(), 0.0001);
    }

    @Test
    void toEntity_invalidEvent_returnsNull() {
        IRSensorMapper mapper = new IRSensorMapper();
        // crack not detected → validation fails
        IRSensorDataDTO dto = new IRSensorDataDTO("S1", "ts", "D1", false, "OK",
                new LocationDTO(7.25, 80.59));

        irsensorData entity = handler.toEntityForPersistence(dto, mapper);

        assertNull(entity);
    }

    @Test
    void toEntity_nullEvent_returnsNull() {
        IRSensorMapper mapper = new IRSensorMapper();
        assertNull(handler.toEntityForPersistence(null, mapper));
    }

    @Test
    void toEntity_mapperIsInvoked() {
        IRSensorMapper mockMapper = mock(IRSensorMapper.class);
        LocationDTO loc = new LocationDTO(7.0, 80.0);
        IRSensorDataDTO dto = new IRSensorDataDTO("S1", "ts", "D1", true, "CRITICAL", loc);

        irsensorData fakeEntity = new irsensorData();
        fakeEntity.setSensorId("S1");
        when(mockMapper.toEntity(dto)).thenReturn(fakeEntity);

        irsensorData result = handler.toEntityForPersistence(dto, mockMapper);

        assertNotNull(result);
        verify(mockMapper).toEntity(dto);
        assertEquals(7.0, result.getLatitude(), 0.0001);
        assertEquals(80.0, result.getLongitude(), 0.0001);
    }
}
