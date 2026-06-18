package com.controller;

import com.dto.sensor.IRSensorDataDTO;
import com.dto.sensor.LocationDTO;
import com.service.CrackLocationQueryService;
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

@WebMvcTest(CrackLocationController.class)
class CrackLocationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CrackLocationQueryService crackLocationQueryService;

    private IRSensorDataDTO buildSampleDto() {
        IRSensorDataDTO dto = new IRSensorDataDTO("IR_Bottom", "2025-06-01T12:00:00Z",
                "esp-001", true, "CRITICAL", new LocationDTO(7.2906, 80.6337));
        dto.setImageUrl("https://s3.amazonaws.com/photo.jpg");
        return dto;
    }

    @Test
    void getCrackLocations_returnsJsonList() throws Exception {
        when(crackLocationQueryService.findAllCrackLocations())
                .thenReturn(List.of(buildSampleDto()));

        mockMvc.perform(get("/api/crack-locations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].sensorId", is("IR_Bottom")))
                .andExpect(jsonPath("$[0].crackDetected", is(true)))
                .andExpect(jsonPath("$[0].location.lat", is(7.2906)));

        verify(crackLocationQueryService).findAllCrackLocations();
    }

    @Test
    void getCrackLocations_emptyList_returns200() throws Exception {
        when(crackLocationQueryService.findAllCrackLocations())
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/crack-locations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void getRecentCrackLocations_defaultHours() throws Exception {
        when(crackLocationQueryService.findRecentCrackLocations(24))
                .thenReturn(List.of(buildSampleDto()));

        mockMvc.perform(get("/api/crack-locations/recent"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        verify(crackLocationQueryService).findRecentCrackLocations(24);
    }

    @Test
    void getRecentCrackLocations_customHours() throws Exception {
        when(crackLocationQueryService.findRecentCrackLocations(12))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/crack-locations/recent").param("hours", "12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        verify(crackLocationQueryService).findRecentCrackLocations(12);
    }
}
