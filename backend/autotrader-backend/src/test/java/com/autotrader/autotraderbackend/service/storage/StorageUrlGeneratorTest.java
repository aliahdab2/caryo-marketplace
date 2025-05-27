package com.autotrader.autotraderbackend.service.storage;

import com.autotrader.autotraderbackend.config.StorageProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.net.URI;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StorageUrlGeneratorTest {

    @Mock
    private StorageProperties storageProperties;

    @Mock
    private StorageConfigurationManager configManager;

    @Mock
    private S3Presigner s3Presigner;

    @Mock
    private PresignedGetObjectRequest presignedRequest;

    private StorageUrlGenerator storageUrlGenerator;

    @BeforeEach
    void setUp() throws Exception {
        // Setup common mocks
        lenient().when(configManager.getBucketName(any())).thenReturn("test-bucket");
        lenient().when(configManager.getFileTypeFromKey(any())).thenReturn("listing-media");
        lenient().when(configManager.isPublicAccessEnabled()).thenReturn(true);
        lenient().when(configManager.getSignedUrlExpirationSeconds()).thenReturn(3600L);
        
        // Setup S3 presigner mock
        lenient().when(presignedRequest.url()).thenReturn(URI.create("https://test-bucket.s3.amazonaws.com/test-key?signature=abc123").toURL());
        lenient().when(s3Presigner.presignGetObject(any(GetObjectPresignRequest.class))).thenReturn(presignedRequest);
        
        storageUrlGenerator = new StorageUrlGenerator(storageProperties, configManager, s3Presigner);
    }

    @Test
    void generateUrl_WithPublicUrlType_ShouldReturnPublicUrl() {
        // Arrange
        String key = "listings/123/image.jpg";
        StorageUrlGenerator.UrlType urlType = StorageUrlGenerator.UrlType.PUBLIC;
        long expirationSeconds = 3600L;

        // Act
        String result = storageUrlGenerator.generateUrl(key, urlType, expirationSeconds);

        // Assert
        assertThat(result).contains("test-bucket");
        assertThat(result).contains(key);
        assertThat(result).doesNotContain("signature=");
    }

    @Test
    void generateUrl_WithSignedUrlType_ShouldReturnSignedUrl() {
        // Arrange
        String key = "listings/123/private-image.jpg";
        StorageUrlGenerator.UrlType urlType = StorageUrlGenerator.UrlType.SIGNED;
        long expirationSeconds = 1800L;
        
        when(configManager.isPublicAccessEnabled()).thenReturn(false);

        // Act
        String result = storageUrlGenerator.generateUrl(key, urlType, expirationSeconds);

        // Assert
        assertThat(result).contains("test-bucket");
        assertThat(result).contains("signature=");
        assertThat(result).startsWith("https://");
    }

    @Test
    void generateUrl_WithCdnUrlType_ShouldReturnCdnUrl() {
        // Arrange
        String key = "listings/123/cdn-image.jpg";
        StorageUrlGenerator.UrlType urlType = StorageUrlGenerator.UrlType.CDN;
        long expirationSeconds = 3600L;

        // Act
        String result = storageUrlGenerator.generateUrl(key, urlType, expirationSeconds);

        // Assert
        // Should fall back to public URL when no CDN is configured
        assertThat(result).contains("test-bucket");
        assertThat(result).contains(key);
    }

    @Test
    void generateUrl_WithInvalidUrlType_ShouldThrowException() {
        // Arrange
        String key = "listings/123/image.jpg";
        long expirationSeconds = 3600L;

        // Act & Assert
        assertThatThrownBy(() -> storageUrlGenerator.generateUrl(key, null, expirationSeconds))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void generateUrl_WithNullKey_ShouldHandleGracefully() {
        // Arrange
        StorageUrlGenerator.UrlType urlType = StorageUrlGenerator.UrlType.PUBLIC;
        long expirationSeconds = 3600L;

        // Act
        String result = storageUrlGenerator.generateUrl(null, urlType, expirationSeconds);

        // Assert
        assertThat(result).contains("test-bucket");
        assertThat(result).endsWith("/null");
    }

    @Test
    void generateUrl_WithEmptyKey_ShouldHandleGracefully() {
        // Arrange
        String key = "";
        StorageUrlGenerator.UrlType urlType = StorageUrlGenerator.UrlType.PUBLIC;
        long expirationSeconds = 3600L;

        // Act
        String result = storageUrlGenerator.generateUrl(key, urlType, expirationSeconds);

        // Assert
        assertThat(result).contains("test-bucket");
        assertThat(result).endsWith("/");
    }

    @Test
    void generateUrl_WithZeroExpiration_ShouldUseDefaultExpiration() {
        // Arrange
        String key = "listings/123/image.jpg";
        StorageUrlGenerator.UrlType urlType = StorageUrlGenerator.UrlType.SIGNED;
        long expirationSeconds = 0L; // Should use default
        
        when(configManager.isPublicAccessEnabled()).thenReturn(false);

        // Act
        String result = storageUrlGenerator.generateUrl(key, urlType, expirationSeconds);

        // Assert
        assertThat(result).contains("test-bucket");
        assertThat(result).contains("signature=");
    }

    @Test
    void generateUrl_WithNegativeExpiration_ShouldUseDefaultExpiration() {
        // Arrange
        String key = "listings/123/image.jpg";
        StorageUrlGenerator.UrlType urlType = StorageUrlGenerator.UrlType.SIGNED;
        long expirationSeconds = -1L; // Should use default
        
        when(configManager.isPublicAccessEnabled()).thenReturn(false);

        // Act
        String result = storageUrlGenerator.generateUrl(key, urlType, expirationSeconds);

        // Assert
        assertThat(result).contains("test-bucket");
        assertThat(result).contains("signature=");
    }

    @Test
    void generateUrl_WithMinIOPublicAccess_ShouldReturnPublicUrl() {
        // Arrange
        String key = "listings/123/minio-image.jpg";
        StorageUrlGenerator.UrlType urlType = StorageUrlGenerator.UrlType.SIGNED;
        long expirationSeconds = 3600L;
        
        when(configManager.isPublicAccessEnabled()).thenReturn(true);

        // Act
        String result = storageUrlGenerator.generateUrl(key, urlType, expirationSeconds);

        // Assert
        assertThat(result).contains("test-bucket");
        assertThat(result).contains(key);
        // Should not contain signature since public access is enabled
        assertThat(result).doesNotContain("signature=");
    }

    @Test
    void clearCache_ShouldExecuteWithoutError() {
        // Act & Assert
        assertThatCode(() -> storageUrlGenerator.clearCache()).doesNotThrowAnyException();
    }

    @Test
    void generateUrl_WithVeryLongKey_ShouldHandleGracefully() {
        // Arrange
        String longKey = "a".repeat(1000) + "/very-long-filename.jpg";
        StorageUrlGenerator.UrlType urlType = StorageUrlGenerator.UrlType.PUBLIC;
        long expirationSeconds = 3600L;

        // Act
        String result = storageUrlGenerator.generateUrl(longKey, urlType, expirationSeconds);

        // Assert
        assertThat(result).contains("test-bucket");
        assertThat(result).contains(longKey);
    }

    @Test
    void generateUrl_WithSpecialCharactersInKey_ShouldHandleGracefully() {
        // Arrange
        String specialKey = "listings/123/file with spaces & special chars!.jpg";
        StorageUrlGenerator.UrlType urlType = StorageUrlGenerator.UrlType.PUBLIC;
        long expirationSeconds = 3600L;

        // Act
        String result = storageUrlGenerator.generateUrl(specialKey, urlType, expirationSeconds);

        // Assert
        assertThat(result).contains("test-bucket");
        assertThat(result).contains(specialKey);
    }

    @Test
    void generateUrl_WithDifferentFileTypes_ShouldHandleAll() {
        // Arrange
        String[] keys = {
                "listings/123/image.jpg",
                "users/456/avatar.png",
                "temp/temp-file.pdf",
                "documents/contract.doc"
        };
        StorageUrlGenerator.UrlType urlType = StorageUrlGenerator.UrlType.PUBLIC;
        long expirationSeconds = 3600L;

        // Act & Assert
        for (String key : keys) {
            String result = storageUrlGenerator.generateUrl(key, urlType, expirationSeconds);
            assertThat(result).contains("test-bucket");
            assertThat(result).contains(key);
        }
    }
}
