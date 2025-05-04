package com.autotrader.autotraderbackend.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.mock.env.MockEnvironment;

@ExtendWith(MockitoExtension.class)
class ApplicationStartupListenerTest {

    @Mock
    private ApplicationReadyEvent event;

    @Test
    void testOnApplicationEvent_logsInfoWhenReady() {
        // Arrange
        MockEnvironment environment = new MockEnvironment();
        environment.addActiveProfile("test");
        environment.setProperty("server.port", "8080");
        environment.setProperty("spring.application.name", "autotrader-backend");
        
        ApplicationStartupListener listener = new ApplicationStartupListener(environment);
        
        // Act - this method only logs information, so we just verify it doesn't throw exceptions
        listener.onApplicationEvent(event);
        
        // No assert needed as the method only logs information, 
        // and we're just verifying it runs without errors
    }
}
