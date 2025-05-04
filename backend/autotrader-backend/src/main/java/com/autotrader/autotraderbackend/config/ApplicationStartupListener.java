package com.autotrader.autotraderbackend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * Listens for application startup completion and logs useful information
 * about the running application.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ApplicationStartupListener implements ApplicationListener<ApplicationReadyEvent> {

    private final Environment env;

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        String serverPort = env.getProperty("server.port", "8080");
        String contextPath = env.getProperty("server.servlet.context-path", "");
        String profileInfo = env.getActiveProfiles().length > 0 ? 
            String.join(", ", env.getActiveProfiles()) : "default";
            
        log.info("\n----------------------------------------------------------\n\t" +
                "Application '{}' is running! Access URLs:\n\t" +
                "Local: \t\thttp://127.0.0.1:{}{}\n\t" +
                "Status: \thttp://127.0.0.1:{}{}/status\n\t" +
                "Health: \thttp://127.0.0.1:{}{}/actuator/health\n\t" +
                "Profiles: \t{}\n" +
                "----------------------------------------------------------",
                env.getProperty("spring.application.name"),
                serverPort, contextPath,
                serverPort, contextPath,
                serverPort, contextPath,
                profileInfo);
    }
}
