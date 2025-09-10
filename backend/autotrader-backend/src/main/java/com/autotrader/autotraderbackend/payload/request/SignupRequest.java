package com.autotrader.autotraderbackend.payload.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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

    @NotBlank
    private String confirmPassword;

    // Seller type selection
    @NotNull
    private Integer sellerTypeId; // 1=private, 2=dealer

    // Private seller fields
    @Size(max = 20)
    private String phone;

    @Size(max = 100)
    private String city;

    // Dealer fields
    @Size(min = 2, max = 100)
    private String businessName;

    @Size(max = 50)
    private String vatNumber;

    @Size(max = 255)
    private String tradingAddress;

    @Email
    @Size(max = 50)
    private String businessEmail;

    @Size(max = 20)
    private String businessPhone;

    @Size(max = 255)
    private String logoUrl;

    // Explicit Getters
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public Set<String> getRole() { return role; }
    public String getPassword() { return password; }
    public String getConfirmPassword() { return confirmPassword; }
    public Integer getSellerTypeId() { return sellerTypeId; }
    public String getPhone() { return phone; }
    public String getCity() { return city; }
    public String getBusinessName() { return businessName; }
    public String getVatNumber() { return vatNumber; }
    public String getTradingAddress() { return tradingAddress; }
    public String getBusinessEmail() { return businessEmail; }
    public String getBusinessPhone() { return businessPhone; }
    public String getLogoUrl() { return logoUrl; }

    // Explicit Setters
    public void setUsername(String username) { this.username = username; }
    public void setEmail(String email) { this.email = email; }
    public void setRole(Set<String> role) { this.role = role; }
    public void setPassword(String password) { this.password = password; }
    public void setConfirmPassword(String confirmPassword) { this.confirmPassword = confirmPassword; }
    public void setSellerTypeId(Integer sellerTypeId) { this.sellerTypeId = sellerTypeId; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setCity(String city) { this.city = city; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }
    public void setVatNumber(String vatNumber) { this.vatNumber = vatNumber; }
    public void setTradingAddress(String tradingAddress) { this.tradingAddress = tradingAddress; }
    public void setBusinessEmail(String businessEmail) { this.businessEmail = businessEmail; }
    public void setBusinessPhone(String businessPhone) { this.businessPhone = businessPhone; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }

    // Helper methods
    public boolean isDealer() {
        return sellerTypeId != null && sellerTypeId == 2;
    }

    public boolean isPrivateSeller() {
        return sellerTypeId != null && sellerTypeId == 1;
    }
}
