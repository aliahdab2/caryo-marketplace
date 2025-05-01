package com.autotrader.autotraderbackend.payload.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MessageResponse {
    private String message;

    // Explicit Constructor
    public MessageResponse(String message) {
        this.message = message;
    }

    // Explicit Getter/Setter (if @Getter/@Setter were removed)
    // public String getMessage() { return message; }
    // public void setMessage(String message) { this.message = message; }
}
