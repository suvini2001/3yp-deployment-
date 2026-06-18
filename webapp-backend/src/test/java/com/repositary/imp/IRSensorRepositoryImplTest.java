package com.repositary.imp;

import com.model.irsensorData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import software.amazon.awssdk.core.pagination.sync.SdkIterable;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.PageIterable;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryEnhancedRequest;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class IRSensorRepositoryImplTest {

    private DynamoDbTable<irsensorData> table;
    private IRSensorRepositoryImpl repository;

    @BeforeEach
    void setUp() {
        DynamoDbEnhancedClient enhancedClient = mock(DynamoDbEnhancedClient.class);
        table = mock(DynamoDbTable.class);
        when(enhancedClient.table(eq("ir_cracks_detection"), any(TableSchema.class))).thenReturn(table);

        repository = new IRSensorRepositoryImpl(enhancedClient);
    }

    @Test
    void testSave() {
        irsensorData data = new irsensorData();
        data.setDeviceId("device-01");

        irsensorData saved = repository.save(data);

        verify(table).putItem(data);
        assertEquals(data, saved);
    }

    @Test
    void testGetAllData() {
        irsensorData data1 = new irsensorData();
        data1.setDeviceId("device-01");
        irsensorData data2 = new irsensorData();
        data2.setDeviceId("device-02");

        PageIterable<irsensorData> pageIterable = mock(PageIterable.class);
        SdkIterable<irsensorData> sdkIterable = mock(SdkIterable.class);

        when(table.scan()).thenReturn(pageIterable);
        when(pageIterable.items()).thenReturn(sdkIterable);
        when(sdkIterable.stream()).thenReturn(Arrays.asList(data1, data2).stream());

        List<irsensorData> result = repository.getAllData();

        assertEquals(2, result.size());
        assertEquals("device-01", result.get(0).getDeviceId());
        assertEquals("device-02", result.get(1).getDeviceId());
    }

    @Test
    void testGetCracksByDeviceAndSensor() {
        irsensorData data1 = new irsensorData();
        data1.setDeviceId("device-01");
        data1.setSensorId("sensor-01");

        PageIterable<irsensorData> pageIterable = mock(PageIterable.class);
        SdkIterable<irsensorData> sdkIterable = mock(SdkIterable.class);

        when(table.query(any(QueryEnhancedRequest.class))).thenReturn(pageIterable);
        when(pageIterable.items()).thenReturn(sdkIterable);
        when(sdkIterable.stream()).thenReturn(Arrays.asList(data1).stream());

        List<irsensorData> result = repository.getCracksByDeviceAndSensor("device-01", "sensor-01");

        assertEquals(1, result.size());
        assertEquals("device-01", result.get(0).getDeviceId());
        assertEquals("sensor-01", result.get(0).getSensorId());

        verify(table).query(any(QueryEnhancedRequest.class));
    }
}
