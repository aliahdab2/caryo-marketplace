package com.autotrader.autotraderbackend.payload.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
public class SignupRequest {
    @NotBlank
    @Size(min = 3, max = 20)
    private String username;

    @NotBlank
    @Size(max = 50)
    @Email
    private String email;

    private Set<String> role;

    @NotBlank
    @Size(min = 6, max = 40)
    private String password;

    // Explicit Getters
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public Set<String> getRole() { return role; } // Getter matches field name 'role'
    public String getPassword() { return password; }

    // Explicit Setters
    public void setUsername(String username) { this.username = username; }
    public void setEmail(String email) { this.email = email; }
    public void setRole(Set<String> role) { this.role = role; }
    public void setPassword(String password) { this.password = password; }
}
