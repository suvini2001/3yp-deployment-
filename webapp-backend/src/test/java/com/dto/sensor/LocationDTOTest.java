package com.dto.sensor;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class LocationDTOTest {

    @Test
    void defaultConstructor_allZeroAndFalse() {
        LocationDTO loc = new LocationDTO();

        assertEquals(0.0, loc.getLat());
        assertEquals(0.0, loc.getLng());
        assertFalse(loc.isValid());
        assertEquals(0, loc.getSatellites());
    }

    @Test
    void twoArgConstructor_setsLatLng() {
        LocationDTO loc = new LocationDTO(7.25, 80.59);

        assertEquals(7.25, loc.getLat());
        assertEquals(80.59, loc.getLng());
        assertFalse(loc.isValid());
        assertEquals(0, loc.getSatellites());
    }

    @Test
    void fourArgConstructor_setsAllFields() {
        LocationDTO loc = new LocationDTO(6.927, 79.861, true, 8);

        assertEquals(6.927, loc.getLat());
        assertEquals(79.861, loc.getLng());
        assertTrue(loc.isValid());
        assertEquals(8, loc.getSatellites());
    }

    @Test
    void settersAndGetters_roundTrip() {
        LocationDTO loc = new LocationDTO();

        loc.setLat(51.5074);
        loc.setLng(-0.1278);
        loc.setValid(true);
        loc.setSatellites(12);

        assertEquals(51.5074, loc.getLat());
        assertEquals(-0.1278, loc.getLng());
        assertTrue(loc.isValid());
        assertEquals(12, loc.getSatellites());
    }
}
