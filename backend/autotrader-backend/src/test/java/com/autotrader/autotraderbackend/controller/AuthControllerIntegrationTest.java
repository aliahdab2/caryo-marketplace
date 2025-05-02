package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.payload.request.LoginRequest;
import com.autotrader.autotraderbackend.payload.request.SignupRequest;
import com.autotrader.autotraderbackend.payload.response.JwtResponse;
import com.autotrader.autotraderbackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeAll;
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
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MinIOContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;

import java.net.URI;
import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Testcontainers
public class AuthControllerIntegrationTest {

    @Container
    public static MinIOContainer minioContainer = new MinIOContainer("minio/minio:RELEASE.2023-09-04T19-57-37Z")
            .withExposedPorts(9000);

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    private String baseUrl;
    private static final String BUCKET_NAME = "autotrader-assets";

    private static String s3Endpoint;

    @DynamicPropertySource
    static void minioProperties(DynamicPropertyRegistry registry) {
        minioContainer.start();
        s3Endpoint = String.format("http://%s:%d", minioContainer.getHost(), minioContainer.getMappedPort(9000));
        registry.add("storage.s3.endpointUrl", () -> s3Endpoint);
        registry.add("storage.s3.accessKeyId", minioContainer::getUserName);
        registry.add("storage.s3.secretAccessKey", minioContainer::getPassword);
        registry.add("storage.s3.bucketName", () -> BUCKET_NAME);
        registry.add("storage.s3.region", () -> "us-east-1");
        registry.add("storage.s3.pathStyleAccessEnabled", () -> "true");
    }

    @BeforeAll
    static void ensureBucketExists() {
        // Wait for MinIO to be ready
        if (s3Endpoint == null) {
            s3Endpoint = String.format("http://%s:%d", minioContainer.getHost(), minioContainer.getMappedPort(9000));
        }
        S3Client s3Client = S3Client.builder()
                .endpointOverride(URI.create(s3Endpoint))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(minioContainer.getUserName(), minioContainer.getPassword())
                ))
                .region(Region.US_EAST_1)
                .forcePathStyle(true)
                .build();
        try {
            s3Client.headBucket(HeadBucketRequest.builder().bucket(BUCKET_NAME).build());
            System.out.println("Bucket '" + BUCKET_NAME + "' already exists.");
        } catch (NoSuchBucketException e) {
            System.out.println("Bucket '" + BUCKET_NAME + "' does not exist. Creating...");
            s3Client.createBucket(CreateBucketRequest.builder().bucket(BUCKET_NAME).build());
            System.out.println("Bucket '" + BUCKET_NAME + "' created.");
        } finally {
            s3Client.close();
        }
    }

    @BeforeEach
    public void setUp() {
        baseUrl = "http://localhost:" + port;
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
                baseUrl + "/auth/signup",
                signupRequest,
                Object.class
        );

        assertEquals(200, registerResponse.getStatusCode().value());

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password123");

        ResponseEntity<JwtResponse> loginResponse = restTemplate.postForEntity(
                baseUrl + "/auth/signin",
                loginRequest,
                JwtResponse.class
        );

        assertEquals(200, loginResponse.getStatusCode().value());

        JwtResponse jwtResponse = loginResponse.getBody();
        assertThat(jwtResponse).isNotNull();
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
