package com.service;

import com.dto.sensor.IRSensorDataDTO;
import com.dto.sensor.LocationDTO;
import com.mapper.IRSensorMapper;
import com.model.irsensorData;
import com.repositary.IRSensorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IRSensorServiceTest {

    @Mock
    private IRSensorRepository repository;

    @Mock
    private IRSensorMapper mapper;

    @Mock
    private CrackEventHandler crackEventHandler;

    @InjectMocks
    private IRSensorService service;

    private irsensorData sampleEntity;
    private IRSensorDataDTO sampleDto;

    @BeforeEach
    void setUp() {
        sampleEntity = new irsensorData();
        sampleEntity.setSensorId("IR_Bottom");
        sampleEntity.setTimestamp("2025-06-01T12:00:00Z");
        sampleEntity.setDeviceId("esp-001");
        sampleEntity.setCrackDetected(true);
        sampleEntity.setStatus("CRITICAL");
        sampleEntity.setLatitude(7.2906);
        sampleEntity.setLongitude(80.6337);

        sampleDto = new IRSensorDataDTO("IR_Bottom", "2025-06-01T12:00:00Z", "esp-001", true, "CRITICAL",
                new LocationDTO(7.2906, 80.6337));
    }

    // ───────── getAllCrackData tests ─────────

    @Test
    void getAllCrackData_returnsMappedDTOs() {
        when(repository.getAllData()).thenReturn(List.of(sampleEntity));
        when(mapper.toDTO(sampleEntity)).thenReturn(sampleDto);

        List<IRSensorDataDTO> result = service.getAllCrackData();

        assertEquals(1, result.size());
        assertEquals("IR_Bottom", result.get(0).getSensorId());
        verify(repository).getAllData();
        verify(mapper).toDTO(sampleEntity);
    }

    @Test
    void getAllCrackData_emptyList_returnsEmpty() {
        when(repository.getAllData()).thenReturn(Collections.emptyList());

        List<IRSensorDataDTO> result = service.getAllCrackData();

        assertTrue(result.isEmpty());
        verify(repository).getAllData();
        verifyNoInteractions(mapper);
    }

    @Test
    void getAllCrackData_multipleEntities_mapsAll() {
        irsensorData entity2 = new irsensorData();
        entity2.setSensorId("IR_Top");
        IRSensorDataDTO dto2 = new IRSensorDataDTO("IR_Top", "ts2", "D2", false, "OK");

        when(repository.getAllData()).thenReturn(List.of(sampleEntity, entity2));
        when(mapper.toDTO(sampleEntity)).thenReturn(sampleDto);
        when(mapper.toDTO(entity2)).thenReturn(dto2);

        List<IRSensorDataDTO> result = service.getAllCrackData();

        assertEquals(2, result.size());
        verify(mapper, times(2)).toDTO(any());
    }

    // ───────── getSpecificCracks tests ─────────

    @Test
    void getSpecificCracks_delegatesToRepository() {
        when(repository.getCracksByDeviceAndSensor("esp-001", "IR_Bottom"))
                .thenReturn(List.of(sampleEntity));
        when(mapper.toDTO(sampleEntity)).thenReturn(sampleDto);

        List<IRSensorDataDTO> result = service.getSpecificCracks("esp-001", "IR_Bottom");

        assertEquals(1, result.size());
        assertEquals("IR_Bottom", result.get(0).getSensorId());
        verify(repository).getCracksByDeviceAndSensor("esp-001", "IR_Bottom");
    }

    @Test
    void getSpecificCracks_noResults_returnsEmpty() {
        when(repository.getCracksByDeviceAndSensor("unknown", "unknown"))
                .thenReturn(Collections.emptyList());

        List<IRSensorDataDTO> result = service.getSpecificCracks("unknown", "unknown");

        assertTrue(result.isEmpty());
    }

    // ───────── saveSensorData tests ─────────

    @Test
    void saveSensorData_validCrack_savesAndReturnsDTO() {
        when(crackEventHandler.toEntityForPersistence(eq(sampleDto), eq(mapper)))
                .thenReturn(sampleEntity);
        when(repository.save(sampleEntity)).thenReturn(sampleEntity);
        when(mapper.toDTO(sampleEntity)).thenReturn(sampleDto);

        IRSensorDataDTO result = service.saveSensorData(sampleDto);

        assertNotNull(result);
        assertEquals("IR_Bottom", result.getSensorId());
        verify(repository).save(sampleEntity);
    }

    @Test
    void saveSensorData_invalidCrack_returnsNullWithoutSaving() {
        when(crackEventHandler.toEntityForPersistence(eq(sampleDto), eq(mapper)))
                .thenReturn(null);

        IRSensorDataDTO result = service.saveSensorData(sampleDto);

        assertNull(result);
        verify(repository, never()).save(any());
    }
}
