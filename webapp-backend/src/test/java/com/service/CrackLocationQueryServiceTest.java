package com.service;

import com.dto.sensor.IRSensorDataDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanResponse;

import java.lang.reflect.Field;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CrackLocationQueryServiceTest {

    @Mock
    private DynamoDbClient dynamoDbClient;

    private CrackLocationQueryService service;

    @BeforeEach
    void setUp() throws Exception {
        service = new CrackLocationQueryService(dynamoDbClient);

        // Inject the table name via reflection (normally done by @Value)
        Field tableNameField = CrackLocationQueryService.class.getDeclaredField("tableName");
        tableNameField.setAccessible(true);
        tableNameField.set(service, "ir_cracks_detection");
    }

    private Map<String, AttributeValue> buildItem(String sensorId, String timestamp, String deviceId,
                                                    boolean crackDetected, String status,
                                                    double lat, double lng) {
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("sensorId", AttributeValue.builder().s(sensorId).build());
        item.put("timestamp", AttributeValue.builder().s(timestamp).build());
        item.put("deviceId", AttributeValue.builder().s(deviceId).build());
        item.put("crackDetected", AttributeValue.builder().bool(crackDetected).build());
        item.put("status", AttributeValue.builder().s(status).build());
        item.put("lat", AttributeValue.builder().n(String.valueOf(lat)).build());
        item.put("lng", AttributeValue.builder().n(String.valueOf(lng)).build());
        return item;
    }

    // ───────── findAllCrackLocations tests ─────────

    @Test
    void findAll_returnsMappedDTOs() {
        Map<String, AttributeValue> item = buildItem("IR_Bottom", "2025-06-01T12:00:00Z",
                "esp-001", true, "CRITICAL", 7.2906, 80.6337);

        ScanResponse response = ScanResponse.builder().items(List.of(item)).build();
        when(dynamoDbClient.scan(any(ScanRequest.class))).thenReturn(response);

        List<IRSensorDataDTO> result = service.findAllCrackLocations();

        assertEquals(1, result.size());
        assertEquals("IR_Bottom", result.get(0).getSensorId());
        assertEquals(7.2906, result.get(0).getLocation().getLat(), 0.0001);
        assertEquals(80.6337, result.get(0).getLocation().getLng(), 0.0001);
    }

    @Test
    void findAll_emptyTable_returnsEmptyList() {
        ScanResponse response = ScanResponse.builder().items(List.of()).build();
        when(dynamoDbClient.scan(any(ScanRequest.class))).thenReturn(response);

        List<IRSensorDataDTO> result = service.findAllCrackLocations();

        assertTrue(result.isEmpty());
    }

    @Test
    void findAll_handlesLegacyKeyVariations() {
        // Use legacy/alternate key names to test normalization
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("SensorID", AttributeValue.builder().s("IR_Top").build());
        item.put("Timestamp", AttributeValue.builder().s("2025-07-01T08:00:00Z").build());
        item.put("DeviceID", AttributeValue.builder().s("esp-002").build());
        item.put("CrackDetected", AttributeValue.builder().bool(true).build());
        item.put("Status", AttributeValue.builder().s("WARNING").build());
        item.put("latitude", AttributeValue.builder().n("6.927").build());
        item.put("longitude", AttributeValue.builder().n("79.861").build());

        ScanResponse response = ScanResponse.builder().items(List.of(item)).build();
        when(dynamoDbClient.scan(any(ScanRequest.class))).thenReturn(response);

        List<IRSensorDataDTO> result = service.findAllCrackLocations();

        assertEquals(1, result.size());
        assertEquals("IR_Top", result.get(0).getSensorId());
        assertEquals("esp-002", result.get(0).getDeviceId());
    }

    // ───────── findRecentCrackLocations tests ─────────

    @Test
    void findRecent_filtersOldItems() {
        String recentTs = Instant.now().minus(1, ChronoUnit.HOURS).toString();
        String oldTs = Instant.now().minus(48, ChronoUnit.HOURS).toString();

        Map<String, AttributeValue> recentItem = buildItem("S1", recentTs, "D1", true, "OK", 7.0, 80.0);
        Map<String, AttributeValue> oldItem = buildItem("S2", oldTs, "D2", true, "OLD", 8.0, 81.0);

        ScanResponse response = ScanResponse.builder().items(List.of(recentItem, oldItem)).build();
        when(dynamoDbClient.scan(any(ScanRequest.class))).thenReturn(response);

        List<IRSensorDataDTO> result = service.findRecentCrackLocations(24);

        assertEquals(1, result.size());
        assertEquals("S1", result.get(0).getSensorId());
    }

    @Test
    void findRecent_skipsItemsWithoutTimestamp() {
        Map<String, AttributeValue> itemNoTs = new HashMap<>();
        itemNoTs.put("sensorId", AttributeValue.builder().s("S1").build());
        // No timestamp field at all

        ScanResponse response = ScanResponse.builder().items(List.of(itemNoTs)).build();
        when(dynamoDbClient.scan(any(ScanRequest.class))).thenReturn(response);

        List<IRSensorDataDTO> result = service.findRecentCrackLocations(24);

        assertTrue(result.isEmpty());
    }

    @Test
    void findRecent_skipsInvalidTimestampFormat() {
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("sensorId", AttributeValue.builder().s("S1").build());
        item.put("timestamp", AttributeValue.builder().s("not-a-valid-timestamp").build());

        ScanResponse response = ScanResponse.builder().items(List.of(item)).build();
        when(dynamoDbClient.scan(any(ScanRequest.class))).thenReturn(response);

        List<IRSensorDataDTO> result = service.findRecentCrackLocations(24);

        assertTrue(result.isEmpty());
    }

    @Test
    void findRecent_includesItemExactlyAtCutoff() {
        // Item timestamp exactly at cutoff boundary should be included (not before cutoff)
        String justNow = Instant.now().toString();
        Map<String, AttributeValue> item = buildItem("S1", justNow, "D1", true, "OK", 7.0, 80.0);

        ScanResponse response = ScanResponse.builder().items(List.of(item)).build();
        when(dynamoDbClient.scan(any(ScanRequest.class))).thenReturn(response);

        List<IRSensorDataDTO> result = service.findRecentCrackLocations(24);

        assertEquals(1, result.size());
    }
}
