package com.integration;

import com.model.EspCamDetection;
import com.repositary.EspCamRepository;
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
 * Integration tests for the /api/detections endpoint.
 *
 * Full Spring context boots on a random port. EspCamRepository is replaced
 * by a @MockitoBean so DynamoDB is never contacted.
 *
 * Flow verified: HTTP GET /api/detections → EspCamController
 *                                         → EspCamRepository (mocked)
 *                                         → JSON response
 */
@Import(IntegrationTestBeanConfig.class)
class EspCamDetectionIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @MockitoBean
    private EspCamRepository espCamRepository;

    // ── helpers ───────────────────────────────────────────────────────────────

    private EspCamDetection buildDetection(String sensorId, String timestamp,
                                           String imageUrl, String status) {
        EspCamDetection d = new EspCamDetection();
        d.setSensorId(sensorId);
        d.setTimestamp(timestamp);
        d.setImageUrl(imageUrl);
        d.setStatus(status);
        return d;
    }

    // ── GET /api/detections ───────────────────────────────────────────────────

    @Test
    void getAllDetections_withOneRecord_returns200AndCorrectJson() {
        when(espCamRepository.findAll()).thenReturn(List.of(
                buildDetection("CAM_Front", "2025-06-01T12:00:00Z",
                        "https://s3.amazonaws.com/img.jpg", "crack_confirmed")));

        ResponseEntity<EspCamDetection[]> response = restTemplate.getForEntity(
                baseUrl() + "/api/detections", EspCamDetection[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);

        EspCamDetection body = response.getBody()[0];
        assertThat(body.getSensorId()).isEqualTo("CAM_Front");
        assertThat(body.getTimestamp()).isEqualTo("2025-06-01T12:00:00Z");
        assertThat(body.getImageUrl()).isEqualTo("https://s3.amazonaws.com/img.jpg");
        assertThat(body.getStatus()).isEqualTo("crack_confirmed");
    }

    @Test
    void getAllDetections_emptyRepository_returns200WithEmptyArray() {
        when(espCamRepository.findAll()).thenReturn(Collections.emptyList());

        ResponseEntity<EspCamDetection[]> response = restTemplate.getForEntity(
                baseUrl() + "/api/detections", EspCamDetection[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
    }

    @Test
    void getAllDetections_multipleRecords_returnsAll() {
        when(espCamRepository.findAll()).thenReturn(List.of(
                buildDetection("CAM_Front", "2025-06-01T10:00:00Z",
                        "https://s3.amazonaws.com/img1.jpg", "crack_confirmed"),
                buildDetection("CAM_Rear",  "2025-06-01T11:00:00Z",
                        "https://s3.amazonaws.com/img2.jpg", "no_crack")
        ));

        ResponseEntity<EspCamDetection[]> response = restTemplate.getForEntity(
                baseUrl() + "/api/detections", EspCamDetection[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(2);
        assertThat(response.getBody()[0].getSensorId()).isEqualTo("CAM_Front");
        assertThat(response.getBody()[1].getSensorId()).isEqualTo("CAM_Rear");
    }

    @Test
    void getAllDetections_nullImageUrl_serializesAsNull() {
        when(espCamRepository.findAll()).thenReturn(List.of(
                buildDetection("CAM_Side", "2025-06-02T09:00:00Z", null, "pending")));

        ResponseEntity<EspCamDetection[]> response = restTemplate.getForEntity(
                baseUrl() + "/api/detections", EspCamDetection[].class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()[0].getImageUrl()).isNull();
    }
}
