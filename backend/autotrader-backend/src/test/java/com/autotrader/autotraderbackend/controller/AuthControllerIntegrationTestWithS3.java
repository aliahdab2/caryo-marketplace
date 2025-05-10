package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.payload.request.LoginRequest;
import com.autotrader.autotraderbackend.payload.request.SignupRequest;
import com.autotrader.autotraderbackend.payload.response.JwtResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.test.IntegrationTestWithS3;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class AuthControllerIntegrationTestWithS3 extends IntegrationTestWithS3 {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private CarListingRepository carListingRepository;

    @Autowired
    private UserRepository userRepository;

    private String baseUrl;

    @BeforeEach
    public void setUp() {
        baseUrl = "http://localhost:" + port;
        carListingRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    public void testRegisterAndLoginUser() {
        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setUsername("testuser");
        signupRequest.setEmail("test@example.com");
        signupRequest.setPassword("password123");
        Set<String> roles = new HashSet<>();
        roles.add("user");
        signupRequest.setRole(roles);

        ResponseEntity<?> registerResponse = restTemplate.postForEntity(
                baseUrl + "/api/auth/signup",
                signupRequest,
                Object.class
        );

        assertEquals(200, registerResponse.getStatusCode().value());

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password123");

        ResponseEntity<JwtResponse> loginResponse = restTemplate.postForEntity(
                baseUrl + "/api/auth/signin",
                loginRequest,
                JwtResponse.class
        );

        assertEquals(200, loginResponse.getStatusCode().value());

        JwtResponse jwtResponse = loginResponse.getBody();
        assertNotNull(jwtResponse);
        assertThat(jwtResponse.getToken()).isNotNull().isNotEmpty();
        assertThat(jwtResponse.getUsername()).isEqualTo("testuser");

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + jwtResponse.getToken());
        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<String> protectedResponse = restTemplate.exchange(
                baseUrl + "/hello",
                HttpMethod.GET,
                entity,
                String.class
        );

        assertEquals(200, protectedResponse.getStatusCode().value());

        ResponseEntity<String> unauthorizedResponse = restTemplate.getForEntity(
                baseUrl + "/hello",
                String.class
        );

        assertThat(unauthorizedResponse.getStatusCode().value()).isIn(401, 403);
    }
}
