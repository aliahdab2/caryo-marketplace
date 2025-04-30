package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.payload.request.LoginRequest;
import com.autotrader.autotraderbackend.payload.request.SignupRequest;
import com.autotrader.autotraderbackend.payload.response.JwtResponse;
import com.autotrader.autotraderbackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class AuthControllerIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    private String baseUrl;

    @BeforeEach
    public void setUp() {
        baseUrl = "http://localhost:" + port;
        // Clear users before each test
        userRepository.deleteAll();
    }

    @Test
    public void testRegisterAndLoginUser() {
        // 1. Register a new user
        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setUsername("testuser");
        signupRequest.setEmail("test@example.com");
        signupRequest.setPassword("password123");
        Set<String> roles = new HashSet<>();
        roles.add("user");
        signupRequest.setRole(roles);

        ResponseEntity<?> registerResponse = restTemplate.postForEntity(
                baseUrl + "/auth/signup",
                signupRequest,
                Object.class
        );

        assertEquals(200, registerResponse.getStatusCodeValue());

        // 2. Login with the registered user
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password123");

        ResponseEntity<JwtResponse> loginResponse = restTemplate.postForEntity(
                baseUrl + "/auth/signin",
                loginRequest,
                JwtResponse.class
        );

        assertEquals(200, loginResponse.getStatusCodeValue());
        assertNotNull(loginResponse.getBody());
        assertNotNull(loginResponse.getBody().getToken());
        assertEquals("testuser", loginResponse.getBody().getUsername());
        
        // 3. Test access to protected endpoint with JWT token
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + loginResponse.getBody().getToken());
        HttpEntity<String> entity = new HttpEntity<>(headers);
        
        ResponseEntity<String> protectedResponse = restTemplate.exchange(
                baseUrl + "/hello",
                HttpMethod.GET,
                entity,
                String.class
        );
        
        assertEquals(200, protectedResponse.getStatusCodeValue());
        
        // 4. Test access to protected endpoint without JWT token (should fail)
        ResponseEntity<String> unauthorizedResponse = restTemplate.getForEntity(
                baseUrl + "/hello",
                String.class
        );
        
        assertEquals(403, unauthorizedResponse.getStatusCodeValue());
    }
}
