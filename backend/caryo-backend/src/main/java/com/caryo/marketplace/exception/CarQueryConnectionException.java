package com.caryo.marketplace.exception;

/**
 * Exception thrown when CarQuery API connection fails
 */
public class CarQueryConnectionException extends CarQueryException {

    private final String endpoint;
    private final int timeoutMs;

    public CarQueryConnectionException(String endpoint, int timeoutMs) {
        super("Connection failed to " + endpoint,
              "Failed to connect to CarQuery API at " + endpoint + " within " + timeoutMs + "ms");
        this.endpoint = endpoint;
        this.timeoutMs = timeoutMs;
    }

    public CarQueryConnectionException(String endpoint, int timeoutMs, Throwable cause) {
        super("Connection failed to " + endpoint,
              "Failed to connect to CarQuery API at " + endpoint + " within " + timeoutMs + "ms", cause);
        this.endpoint = endpoint;
        this.timeoutMs = timeoutMs;
    }

    public CarQueryConnectionException(String operation, String endpoint, int timeoutMs, Throwable cause) {
        super(operation, "Failed to connect to " + endpoint + " within " + timeoutMs + "ms", cause);
        this.endpoint = endpoint;
        this.timeoutMs = timeoutMs;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public int getTimeoutMs() {
        return timeoutMs;
    }
}
