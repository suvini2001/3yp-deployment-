package com.integration;

import com.dto.sensor.IRSensorDataDTO;
import com.dto.sensor.LocationDTO;
import com.repositary.IRSensorRepository;
import com.model.irsensorData;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Integration tests for the /api/cracks/{deviceId}/{sensorId} endpoint.
 *
 * Full Spring context boots on a random port. IRSensorRepository is
 * replaced by a @MockitoBean so DynamoDB is never contacted.
 *
 * Flow verified: HTTP GET /api/cracks/{deviceId}/{sensorId}
 *                         → irsensorController
 *                         → IRSensorService
 *                         → IRSensorMapper
 *                         → IRSensorRepository (mocked)
 *                         → JSON response
 */
@Import(IntegrationTestBeanConfig.class)
class IRSensorIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @MockitoBean
    private IRSensorRepository irSensorRepository;

    // ── helpers ───────────────────────────────────────────────────────────────

    private irsensorData buildEntity(String sensorId, String timestamp,
                                      String deviceId, boolean crackDetected,
                                      String status, double lat, double lng) {
        irsensorData entity = new irsensorData();
        entity.setSensorId(sensorId);
        entity.setTimestamp(timestamp);
        entity.setDeviceId(deviceId);
        entity.setCrackDetected(crackDetected);
        entity.setStatus(status);
        entity.setLatitude(lat);
        entity.setLongitude(lng);
        return entity;
    }

    // ── GET /api/cracks/{deviceId}/{sensorId} ─────────────────────────────────

    @Test
    void getCracksByDeviceAndSensor_withOneResult_returns200AndCorrectJson() {
        irsensorData entity = buildEntity(
                "IR_Bottom", "2025-06-01T12:00:00Z", "esp-001",
                true, "CRITICAL", 7.2906, 80.6337);

        when(irSensorRepository.getCracksByDeviceAndSensor("esp-001", "IR_Bottom"))
                .thenReturn(List.of(entity));

        ResponseEntity<IRSensorDataDTO[]> response = restTemplate.getForEntity(
                baseUrl() + "/api/cracks/esp-001/IR_Bottom", IRSensorDataDTO[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);

        IRSensorDataDTO dto = response.getBody()[0];
        assertThat(dto.getSensorId()).isEqualTo("IR_Bottom");
        assertThat(dto.getDeviceId()).isEqualTo("esp-001");
        assertThat(dto.isCrackDetected()).isTrue();
        assertThat(dto.getStatus()).isEqualTo("CRITICAL");
        assertThat(dto.getLocation().getLat()).isEqualTo(7.2906);
        assertThat(dto.getLocation().getLng()).isEqualTo(80.6337);
    }

    @Test
    void getCracksByDeviceAndSensor_noResults_returns200WithEmptyArray() {
        when(irSensorRepository.getCracksByDeviceAndSensor("unknown", "unknown"))
                .thenReturn(Collections.emptyList());

        ResponseEntity<IRSensorDataDTO[]> response = restTemplate.getForEntity(
                baseUrl() + "/api/cracks/unknown/unknown", IRSensorDataDTO[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
    }

    @Test
    void getCracksByDeviceAndSensor_multipleResults_returnsAll() {
        irsensorData entity1 = buildEntity("IR_Bottom", "ts1", "esp-001", true,  "CRITICAL", 7.29, 80.63);
        irsensorData entity2 = buildEntity("IR_Bottom", "ts2", "esp-001", false, "OK",       7.30, 80.64);

        when(irSensorRepository.getCracksByDeviceAndSensor("esp-001", "IR_Bottom"))
                .thenReturn(List.of(entity1, entity2));

        ResponseEntity<IRSensorDataDTO[]> response = restTemplate.getForEntity(
                baseUrl() + "/api/cracks/esp-001/IR_Bottom", IRSensorDataDTO[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(2);
        assertThat(response.getBody()[0].isCrackDetected()).isTrue();
        assertThat(response.getBody()[1].isCrackDetected()).isFalse();
    }

    @Test
    void getCracksByDeviceAndSensor_differentDevices_isolatedCorrectly() {
        irsensorData entityA = buildEntity("IR_Top", "ts1", "esp-002", true, "WARNING", 6.9, 79.8);

        when(irSensorRepository.getCracksByDeviceAndSensor("esp-002", "IR_Top"))
                .thenReturn(List.of(entityA));
        when(irSensorRepository.getCracksByDeviceAndSensor("esp-001", "IR_Bottom"))
                .thenReturn(Collections.emptyList());

        // First device — should return 1 result
        ResponseEntity<IRSensorDataDTO[]> responseA = restTemplate.getForEntity(
                baseUrl() + "/api/cracks/esp-002/IR_Top", IRSensorDataDTO[].class);

        assertThat(responseA.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(responseA.getBody()).hasSize(1);
        assertThat(responseA.getBody()[0].getDeviceId()).isEqualTo("esp-002");

        // Second device — should return 0 results
        ResponseEntity<IRSensorDataDTO[]> responseB = restTemplate.getForEntity(
                baseUrl() + "/api/cracks/esp-001/IR_Bottom", IRSensorDataDTO[].class);

        assertThat(responseB.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(responseB.getBody()).isEmpty();
    }

    @Test
    void getCracksByDeviceAndSensor_noCrackDetected_serializesAsFalse() {
        irsensorData entity = buildEntity("IR_Side", "2025-06-05T08:00:00Z",
                "esp-003", false, "OK", 7.0, 80.0);

        when(irSensorRepository.getCracksByDeviceAndSensor("esp-003", "IR_Side"))
                .thenReturn(List.of(entity));

        ResponseEntity<IRSensorDataDTO[]> response = restTemplate.getForEntity(
                baseUrl() + "/api/cracks/esp-003/IR_Side", IRSensorDataDTO[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()[0].isCrackDetected()).isFalse();
        assertThat(response.getBody()[0].getStatus()).isEqualTo("OK");
    }
}
