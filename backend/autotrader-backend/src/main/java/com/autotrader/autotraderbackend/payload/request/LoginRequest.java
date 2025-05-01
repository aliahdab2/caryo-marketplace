package com.autotrader.autotraderbackend.payload.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequest {
    @NotBlank
    private String username;

    @NotBlank
    private String password;

    // Explicit Getters
    public String getUsername() { return username; }
    public String getPassword() { return password; }

    // Explicit Setters
    public void setUsername(String username) { this.username = username; }
    public void setPassword(String password) { this.password = password; }
}
