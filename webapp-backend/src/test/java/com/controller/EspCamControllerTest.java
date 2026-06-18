package com.controller;

import com.model.EspCamDetection;
import com.repositary.EspCamRepository;
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

@WebMvcTest(EspCamController.class)
class EspCamControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EspCamRepository repository;

    @Test
    void getAllDetections_returnsDetectionList() throws Exception {
        EspCamDetection detection = new EspCamDetection();
        detection.setSensorId("CAM_Front");
        detection.setTimestamp("2025-06-01T12:00:00Z");
        detection.setImageUrl("https://s3.amazonaws.com/img.jpg");
        detection.setStatus("crack_confirmed");

        when(repository.findAll()).thenReturn(List.of(detection));

        mockMvc.perform(get("/api/detections"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].sensorId", is("CAM_Front")))
                .andExpect(jsonPath("$[0].imageUrl", is("https://s3.amazonaws.com/img.jpg")));

        verify(repository).findAll();
    }

    @Test
    void getAllDetections_emptyList_returns200() throws Exception {
        when(repository.findAll()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/detections"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void getAllDetections_multipleResults() throws Exception {
        EspCamDetection d1 = new EspCamDetection();
        d1.setSensorId("CAM_Front");
        d1.setTimestamp("ts1");

        EspCamDetection d2 = new EspCamDetection();
        d2.setSensorId("CAM_Rear");
        d2.setTimestamp("ts2");

        when(repository.findAll()).thenReturn(List.of(d1, d2));

        mockMvc.perform(get("/api/detections"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }
}
