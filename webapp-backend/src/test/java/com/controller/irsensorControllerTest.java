package com.controller;

import com.dto.sensor.IRSensorDataDTO;
import com.dto.sensor.LocationDTO;
import com.service.IRSensorService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(irsensorController.class)
class irsensorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private IRSensorService service;

    @Test
    void getCracksByDeviceAndSensor_returnsList() throws Exception {
        IRSensorDataDTO dto = new IRSensorDataDTO("IR_Bottom", "2025-06-01T12:00:00Z",
                "esp-001", true, "CRITICAL", new LocationDTO(7.29, 80.63));

        when(service.getSpecificCracks("esp-001", "IR_Bottom")).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/cracks/esp-001/IR_Bottom"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].sensorId", is("IR_Bottom")))
                .andExpect(jsonPath("$[0].deviceId", is("esp-001")))
                .andExpect(jsonPath("$[0].crackDetected", is(true)));

        verify(service).getSpecificCracks("esp-001", "IR_Bottom");
    }

    @Test
    void getCracksByDeviceAndSensor_noResults_returnsEmptyList() throws Exception {
        when(service.getSpecificCracks("unknown", "unknown"))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/cracks/unknown/unknown"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void getCracksByDeviceAndSensor_multipleResults() throws Exception {
        IRSensorDataDTO dto1 = new IRSensorDataDTO("IR_Bottom", "ts1", "esp-001", true, "CRITICAL");
        IRSensorDataDTO dto2 = new IRSensorDataDTO("IR_Bottom", "ts2", "esp-001", false, "OK");

        when(service.getSpecificCracks("esp-001", "IR_Bottom"))
                .thenReturn(List.of(dto1, dto2));

        mockMvc.perform(get("/api/cracks/esp-001/IR_Bottom"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }
}
