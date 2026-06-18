package com.repositary;

import com.model.EspCamDetection;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import software.amazon.awssdk.core.pagination.sync.SdkIterable;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.PageIterable;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class EspCamRepositoryTest {

    private DynamoDbTable<EspCamDetection> table;
    private EspCamRepository repository;

    @BeforeEach
    void setUp() {
        DynamoDbEnhancedClient enhancedClient = mock(DynamoDbEnhancedClient.class);
        table = mock(DynamoDbTable.class);
        when(enhancedClient.table(eq("ir_cracks_detection"), any(TableSchema.class))).thenReturn(table);

        repository = new EspCamRepository(enhancedClient);
    }

    @Test
    void testSave() {
        EspCamDetection detection = new EspCamDetection();
        detection.setSensorId("cam-01");

        repository.save(detection);

        verify(table).putItem(detection);
    }

    @Test
    void testFindAll() {
        EspCamDetection det1 = new EspCamDetection();
        det1.setSensorId("cam-01");
        EspCamDetection det2 = new EspCamDetection();
        det2.setSensorId("cam-02");

        PageIterable<EspCamDetection> pageIterable = mock(PageIterable.class);
        SdkIterable<EspCamDetection> sdkIterable = mock(SdkIterable.class);

        when(table.scan()).thenReturn(pageIterable);
        when(pageIterable.items()).thenReturn(sdkIterable);
        when(sdkIterable.stream()).thenReturn(Arrays.asList(det1, det2).stream());

        List<EspCamDetection> result = repository.findAll();

        assertEquals(2, result.size());
        assertEquals("cam-01", result.get(0).getSensorId());
        assertEquals("cam-02", result.get(1).getSensorId());
    }

    @Test
    void testFindLatestBySensor() {
        EspCamDetection det1 = new EspCamDetection();
        det1.setSensorId("sensor-01");
        det1.setTimestamp("2025-06-01T12:00:00Z");

        EspCamDetection det2 = new EspCamDetection();
        det2.setSensorId("sensor-01");
        det2.setTimestamp("2025-06-01T13:00:00Z");

        EspCamDetection det3 = new EspCamDetection();
        det3.setSensorId("sensor-02");
        det3.setTimestamp("2025-06-01T14:00:00Z");

        PageIterable<EspCamDetection> pageIterable = mock(PageIterable.class);
        SdkIterable<EspCamDetection> sdkIterable = mock(SdkIterable.class);

        when(table.scan()).thenReturn(pageIterable);
        when(pageIterable.items()).thenReturn(sdkIterable);
        when(sdkIterable.stream()).thenReturn(Arrays.asList(det1, det2, det3).stream());

        List<EspCamDetection> result = repository.findLatestBySensor("sensor-01");

        assertEquals(2, result.size());
        assertEquals("2025-06-01T13:00:00Z", result.get(0).getTimestamp());
        assertEquals("2025-06-01T12:00:00Z", result.get(1).getTimestamp());
    }
}
