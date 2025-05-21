package com.autotrader.autotraderbackend.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.ApplicationEventMulticaster;
import org.springframework.context.event.SimpleApplicationEventMulticaster;
import org.springframework.core.task.SimpleAsyncTaskExecutor;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Configuration class for asynchronous event handling.
 * Enables asynchronous event processing for listing events.
 */
@Configuration
@EnableAsync
@Slf4j
public class AsyncEventsConfig {

    /**
     * Creates an application event multicaster that uses
     * an asynchronous task executor to dispatch events.
     */
    @Bean(name = "applicationEventMulticaster")
    public ApplicationEventMulticaster applicationEventMulticaster() {
        SimpleApplicationEventMulticaster eventMulticaster = new SimpleApplicationEventMulticaster();
        eventMulticaster.setTaskExecutor(new SimpleAsyncTaskExecutor("events-"));
        log.info("Configured asynchronous event multicaster");
        return eventMulticaster;
    }

    /**
     * Creates a task executor for methods annotated with @Async.
     * This provides more control over the thread pool and error handling.
     */
    @Bean
    public Executor asyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(3); // Minimum number of threads to keep alive
        executor.setMaxPoolSize(10);  // Maximum pool size to handle spikes
        executor.setQueueCapacity(25); // Queue capacity before rejecting
        executor.setThreadNamePrefix("async-events-");
        executor.initialize();
        log.info("Configured async executor for @Async methods with pool size {}-{}", 
                executor.getCorePoolSize(), executor.getMaxPoolSize());
        return executor;
    }
}
