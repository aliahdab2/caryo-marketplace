package com.autotrader.autotraderbackend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Configuration for asynchronous email processing.
 * Provides a dedicated thread pool for email operations to avoid blocking the main application.
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    /**
     * Configure a dedicated thread pool for email processing.
     * This ensures email operations don't block the main application threads.
     */
    @Bean(name = "emailTaskExecutor")
    public Executor emailTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        
        // Core pool size - minimum number of threads to keep alive
        executor.setCorePoolSize(2);
        
        // Maximum pool size - maximum number of threads to create
        executor.setMaxPoolSize(10);
        
        // Queue capacity - how many tasks can wait in the queue
        executor.setQueueCapacity(100);
        
        // Thread name prefix for easy identification in logs
        executor.setThreadNamePrefix("EmailAsync-");
        
        // Allow core threads to timeout and shut down
        executor.setAllowCoreThreadTimeOut(true);
        
        // Keep alive time for idle threads (in seconds)
        executor.setKeepAliveSeconds(60);
        
        // Wait for tasks to complete on shutdown
        executor.setWaitForTasksToCompleteOnShutdown(true);
        
        // Timeout for waiting for tasks to complete (in seconds)
        executor.setAwaitTerminationSeconds(30);
        
        // Initialize the executor
        executor.initialize();
        
        return executor;
    }
}
