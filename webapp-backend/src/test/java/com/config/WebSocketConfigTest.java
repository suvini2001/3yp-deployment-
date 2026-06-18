package com.config;

import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.StompWebSocketEndpointRegistration;
import static org.mockito.Mockito.*;

class WebSocketConfigTest {

    @Test
    void testConfigureMessageBroker() {
        WebSocketConfig webSocketConfig = new WebSocketConfig();
        MessageBrokerRegistry registry = mock(MessageBrokerRegistry.class);

        webSocketConfig.configureMessageBroker(registry);

        verify(registry).enableSimpleBroker("/topic");
        verify(registry).setApplicationDestinationPrefixes("/app");
    }

    @Test
    void testRegisterStompEndpoints() {
        WebSocketConfig webSocketConfig = new WebSocketConfig();
        StompEndpointRegistry registry = mock(StompEndpointRegistry.class);
        StompWebSocketEndpointRegistration registration = mock(StompWebSocketEndpointRegistration.class);

        when(registry.addEndpoint(anyString())).thenReturn(registration);
        when(registration.setAllowedOriginPatterns(any(String[].class))).thenReturn(registration);

        webSocketConfig.registerStompEndpoints(registry);

        verify(registry).addEndpoint("/raid-websocket");
        verify(registration).setAllowedOriginPatterns("*");
        verify(registration).withSockJS();
    }
}
