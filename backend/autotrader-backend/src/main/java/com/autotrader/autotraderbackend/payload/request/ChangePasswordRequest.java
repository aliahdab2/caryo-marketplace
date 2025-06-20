package com.autotrader.autotraderbackend.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChangePasswordRequest {
    @NotBlank
    private String currentPassword;

    @NotBlank
    @Size(min = 8, message = "New password must be at least 8 characters long")
    private String newPassword;

    // Explicit Getters
    public String getCurrentPassword() { 
        return currentPassword; 
    }
    
    public String getNewPassword() { 
        return newPassword; 
    }

    // Explicit Setters
    public void setCurrentPassword(String currentPassword) { 
        this.currentPassword = currentPassword; 
    }
    
    public void setNewPassword(String newPassword) { 
        this.newPassword = newPassword; 
    }
}
