package com.integration;

import com.dto.sensor.IRSensorDataDTO;
import com.dto.sensor.LocationDTO;
import com.service.CrackLocationQueryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanResponse;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Integration tests for the /api/crack-locations endpoints.
 *
 * The full Spring context starts (RANDOM_PORT). AWS DynamoDB is replaced by
 * a @MockitoBean so no real network traffic leaves the JVM.
 *
 * Flow verified: HTTP request → CrackLocationController
 *                             → CrackLocationQueryService
 *                             → DynamoDbClient (mocked)
 *                             → JSON response
 */
@Import(IntegrationTestBeanConfig.class)
class CrackLocationIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    // Override the stub provided by IntegrationTestBeanConfig so each test
    // can configure its own return value.
    @MockitoBean
    private DynamoDbClient dynamoDbClient;

    // ── helpers ───────────────────────────────────────────────────────────────

    private Map<String, AttributeValue> buildDynamoItem(String sensorId, String timestamp,
                                                         String deviceId, boolean crackDetected,
                                                         String status, double lat, double lng) {
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("sensorId",      AttributeValue.builder().s(sensorId).build());
        item.put("timestamp",     AttributeValue.builder().s(timestamp).build());
        item.put("deviceId",      AttributeValue.builder().s(deviceId).build());
        item.put("crackDetected", AttributeValue.builder().bool(crackDetected).build());
        item.put("status",        AttributeValue.builder().s(status).build());
        item.put("lat",           AttributeValue.builder().n(String.valueOf(lat)).build());
        item.put("lng",           AttributeValue.builder().n(String.valueOf(lng)).build());
        return item;
    }

    private void givenDynamoReturns(Map<String, AttributeValue>... items) {
        ScanResponse response = ScanResponse.builder().items(List.of(items)).build();
        when(dynamoDbClient.scan(any(ScanRequest.class))).thenReturn(response);
    }

    // ── /api/crack-locations (GET all) ────────────────────────────────────────

    @Test
    void getAllCrackLocations_withOneItem_returns200AndCorrectJson() {
        givenDynamoReturns(buildDynamoItem(
                "IR_Bottom", "2025-06-01T12:00:00Z",
                "esp-001", true, "CRITICAL", 7.2906, 80.6337));

        ResponseEntity<IRSensorDataDTO[]> response = restTemplate.getForEntity(
                baseUrl() + "/api/crack-locations", IRSensorDataDTO[].class);

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
    void getAllCrackLocations_emptyTable_returns200WithEmptyArray() {
        givenDynamoReturns(); // empty varargs → empty list

        ResponseEntity<IRSensorDataDTO[]> response = restTemplate.getForEntity(
                baseUrl() + "/api/crack-locations", IRSensorDataDTO[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
    }

    @Test
    void getAllCrackLocations_multipleItems_returnsAll() {
        givenDynamoReturns(
                buildDynamoItem("IR_Bottom", "2025-06-01T10:00:00Z", "esp-001", true,  "CRITICAL", 7.29, 80.63),
                buildDynamoItem("IR_Top",    "2025-06-01T11:00:00Z", "esp-002", false, "OK",       6.92, 79.86)
        );

        ResponseEntity<IRSensorDataDTO[]> response = restTemplate.getForEntity(
                baseUrl() + "/api/crack-locations", IRSensorDataDTO[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(2);
    }

    @Test
    void getAllCrackLocations_legacyKeyVariants_normalizedCorrectly() {
        // DynamoDB data that uses legacy/uppercase key names
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("SensorID",     AttributeValue.builder().s("IR_Top").build());
        item.put("Timestamp",    AttributeValue.builder().s("2025-07-01T08:00:00Z").build());
        item.put("DeviceID",     AttributeValue.builder().s("esp-002").build());
        item.put("CrackDetected",AttributeValue.builder().bool(true).build());
        item.put("Status",       AttributeValue.builder().s("WARNING").build());
        item.put("latitude",     AttributeValue.builder().n("6.927").build());
        item.put("longitude",    AttributeValue.builder().n("79.861").build());
        givenDynamoReturns(item);

        ResponseEntity<IRSensorDataDTO[]> response = restTemplate.getForEntity(
                baseUrl() + "/api/crack-locations", IRSensorDataDTO[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody()[0].getSensorId()).isEqualTo("IR_Top");
    }

    // ── /api/crack-locations/recent (GET recent) ──────────────────────────────

    @Test
    void getRecentCrackLocations_defaultHours_returnsRecentOnly() {
        String recentTs = Instant.now().minus(1, ChronoUnit.HOURS).toString();
        String oldTs    = Instant.now().minus(48, ChronoUnit.HOURS).toString();

        givenDynamoReturns(
                buildDynamoItem("S1", recentTs, "D1", true,  "OK",  7.0, 80.0),
                buildDynamoItem("S2", oldTs,    "D2", false, "OLD", 8.0, 81.0)
        );

        ResponseEntity<IRSensorDataDTO[]> response = restTemplate.getForEntity(
                baseUrl() + "/api/crack-locations/recent", IRSensorDataDTO[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody()[0].getSensorId()).isEqualTo("S1");
    }

    @Test
    void getRecentCrackLocations_customHoursParam_filtersCorrectly() {
        // Only item within 6 hours should survive when hours=6
        String sixHoursAgo  = Instant.now().minus(5,  ChronoUnit.HOURS).toString();
        String twelveHrsAgo = Instant.now().minus(12, ChronoUnit.HOURS).toString();

        givenDynamoReturns(
                buildDynamoItem("NEAR", sixHoursAgo,  "D1", true, "OK", 7.0, 80.0),
                buildDynamoItem("FAR",  twelveHrsAgo, "D2", true, "OK", 8.0, 81.0)
        );

        ResponseEntity<IRSensorDataDTO[]> response = restTemplate.getForEntity(
                baseUrl() + "/api/crack-locations/recent?hours=6", IRSensorDataDTO[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody()[0].getSensorId()).isEqualTo("NEAR");
    }

    @Test
    void getRecentCrackLocations_emptyTable_returns200WithEmptyArray() {
        givenDynamoReturns();

        ResponseEntity<IRSensorDataDTO[]> response = restTemplate.getForEntity(
                baseUrl() + "/api/crack-locations/recent", IRSensorDataDTO[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
    }

    @Test
    void getRecentCrackLocations_invalidTimestampItem_skipped() {
        Map<String, AttributeValue> badItem = new HashMap<>();
        badItem.put("sensorId",  AttributeValue.builder().s("BAD").build());
        badItem.put("timestamp", AttributeValue.builder().s("not-a-timestamp").build());
        givenDynamoReturns(badItem);

        ResponseEntity<IRSensorDataDTO[]> response = restTemplate.getForEntity(
                baseUrl() + "/api/crack-locations/recent", IRSensorDataDTO[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
    }
}
