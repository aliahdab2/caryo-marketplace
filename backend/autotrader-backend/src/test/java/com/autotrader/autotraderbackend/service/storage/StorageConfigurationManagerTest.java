package com.autotrader.autotraderbackend.service.storage;

import com.autotrader.autotraderbackend.config.StorageProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.lenient;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class StorageConfigurationManagerTest {

    @Mock
    private StorageProperties storageProperties;

    @Mock
    private StorageKeyGenerator keyGenerator;

    @Mock
    private StorageProperties.S3 s3Properties;

    @Mock
    private StorageProperties.General generalProperties;

    private StorageConfigurationManager configurationManager;

    @BeforeEach
    void setUp() {
        lenient().when(storageProperties.getS3()).thenReturn(s3Properties);
        lenient().when(storageProperties.getGeneral()).thenReturn(generalProperties);
        
        configurationManager = new StorageConfigurationManager(storageProperties, keyGenerator);
    }

    @Test
    void getBucketName_WithS3BucketConfigured_ShouldReturnS3Bucket() {
        // Arrange
        lenient().when(s3Properties.getBucketName()).thenReturn("s3-production-bucket");
        lenient().when(generalProperties.getDefaultBucketName()).thenReturn("default-bucket");

        // Act
        String result = configurationManager.getBucketName("listing-media");

        // Assert
        assertThat(result).isEqualTo("s3-production-bucket");
    }

    @Test
    void getBucketName_WithNullS3Bucket_ShouldReturnDefaultBucket() {
        // Arrange
        lenient().when(s3Properties.getBucketName()).thenReturn(null);
        lenient().when(generalProperties.getDefaultBucketName()).thenReturn("default-bucket");

        // Act
        String result = configurationManager.getBucketName("listing-media");

        // Assert
        assertThat(result).isEqualTo("default-bucket");
    }

    @Test
    void getDefaultBucketName_ShouldReturnBucketName() {
        // Arrange
        lenient().when(s3Properties.getBucketName()).thenReturn("test-bucket");

        // Act
        String result = configurationManager.getDefaultBucketName();

        // Assert
        assertThat(result).isEqualTo("test-bucket");
    }

    @Test
    void generateStorageKey_ForListingMedia_ShouldDelegateToKeyGenerator() {
        // Arrange
        Long listingId = 123L;
        String filename = "test-image.jpg";
        String expectedKey = "listings/123/20240101_120000_test-image.jpg";
        when(keyGenerator.generateListingMediaKey(listingId, filename)).thenReturn(expectedKey);

        // Act
        String result = configurationManager.generateStorageKey("listing-media", listingId, filename);

        // Assert
        assertThat(result).isEqualTo(expectedKey);
        verify(keyGenerator).generateListingMediaKey(listingId, filename);
    }

    @Test
    void generateStorageKey_ForUserAvatar_ShouldDelegateToKeyGenerator() {
        // Arrange
        Long userId = 456L;
        String filename = "avatar.png";
        String expectedKey = "users/456/avatar_20240101_120000_avatar.png";
        when(keyGenerator.generateUserAvatarKey(userId, filename)).thenReturn(expectedKey);

        // Act
        String result = configurationManager.generateStorageKey("user-avatar", userId, filename);

        // Assert
        assertThat(result).isEqualTo(expectedKey);
        verify(keyGenerator).generateUserAvatarKey(userId, filename);
    }

    @Test
    void generateStorageKey_ForTempUpload_ShouldDelegateToKeyGenerator() {
        // Arrange
        String filename = "temp-file.pdf";
        String expectedKey = "temp/uuid-123_temp-file.pdf";
        when(keyGenerator.generateTempUploadKey(filename)).thenReturn(expectedKey);

        // Act
        String result = configurationManager.generateStorageKey("temp-upload", filename);

        // Assert
        assertThat(result).isEqualTo(expectedKey);
        verify(keyGenerator).generateTempUploadKey(filename);
    }

    @Test
    void generateStorageKey_ForDocument_ShouldDelegateToKeyGenerator() {
        // Arrange
        String category = "contracts";
        String filename = "agreement.pdf";
        String expectedKey = "documents/contracts/20240101_120000_agreement.pdf";
        when(keyGenerator.generateDocumentKey(category, filename)).thenReturn(expectedKey);

        // Act
        String result = configurationManager.generateStorageKey("document", category, filename);

        // Assert
        assertThat(result).isEqualTo(expectedKey);
        verify(keyGenerator).generateDocumentKey(category, filename);
    }

    @Test
    void generateStorageKey_ForSampleData_ShouldDelegateToKeyGenerator() {
        // Arrange
        String category = "cars";
        String filename = "sample-data.json";
        String expectedKey = "samples/cars/sample-data.json";
        when(keyGenerator.generateSampleDataKey(category, filename)).thenReturn(expectedKey);

        // Act
        String result = configurationManager.generateStorageKey("sample-data", category, filename);

        // Assert
        assertThat(result).isEqualTo(expectedKey);
        verify(keyGenerator).generateSampleDataKey(category, filename);
    }

    @Test
    void generateStorageKey_WithUnsupportedType_ShouldThrowException() {
        // Act & Assert
        assertThatThrownBy(() -> configurationManager.generateStorageKey("unsupported-type", "param1", "param2"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Invalid file type or parameters for key generation: unsupported-type");
    }

    @Test
    void generateStorageKey_WithInvalidParameters_ShouldThrowException() {
        // Act & Assert
        assertThatThrownBy(() -> configurationManager.generateStorageKey("listing-media", "invalid", "params"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Invalid file type or parameters for key generation: listing-media");
    }

    @Test
    void getStorageBaseUrl_WithEndpointAndPathStyle_ShouldReturnCorrectUrl() {
        // Arrange
        when(s3Properties.getEndpointUrl()).thenReturn("http://localhost:9000");
        when(s3Properties.isPathStyleAccessEnabled()).thenReturn(true);
        when(s3Properties.getBucketName()).thenReturn("test-bucket");

        // Act
        String result = configurationManager.getStorageBaseUrl();

        // Assert
        assertThat(result).isEqualTo("http://localhost:9000/test-bucket");
    }

    @Test
    void getStorageBaseUrl_WithVirtualHostedStyle_ShouldReturnCorrectUrl() {
        // Arrange
        when(s3Properties.getEndpointUrl()).thenReturn("https://s3.amazonaws.com");
        when(s3Properties.isPathStyleAccessEnabled()).thenReturn(false);
        when(s3Properties.getBucketName()).thenReturn("production-bucket");
        when(s3Properties.getRegion()).thenReturn("us-east-1");

        // Act
        String result = configurationManager.getStorageBaseUrl();

        // Assert
        assertThat(result).isEqualTo("https://production-bucket.s3.us-east-1.amazonaws.com");
    }

    @Test
    void getStorageBaseUrl_WithGeneralBaseUrl_ShouldReturnConfiguredUrl() {
        // Arrange
        when(s3Properties.getEndpointUrl()).thenReturn(null);
        when(generalProperties.getBaseUrl()).thenReturn("https://cdn.example.com");

        // Act
        String result = configurationManager.getStorageBaseUrl();

        // Assert
        assertThat(result).isEqualTo("https://cdn.example.com");
    }

    @Test
    void isPublicAccessEnabled_ShouldReturnConfiguredValue() {
        // Arrange
        when(generalProperties.isPublicAccessEnabled()).thenReturn(true);

        // Act
        boolean result = configurationManager.isPublicAccessEnabled();

        // Assert
        assertThat(result).isTrue();
    }

    @Test
    void getStorageRegion_WithS3Region_ShouldReturnS3Region() {
        // Arrange
        lenient().when(s3Properties.getRegion()).thenReturn("us-west-2");
        lenient().when(generalProperties.getDefaultRegion()).thenReturn("us-east-1");

        // Act
        String result = configurationManager.getStorageRegion();

        // Assert
        assertThat(result).isEqualTo("us-west-2");
    }

    @Test
    void getStorageRegion_WithoutS3Region_ShouldReturnDefaultRegion() {
        // Arrange
        when(s3Properties.getRegion()).thenReturn(null);
        when(generalProperties.getDefaultRegion()).thenReturn("us-east-1");

        // Act
        String result = configurationManager.getStorageRegion();

        // Assert
        assertThat(result).isEqualTo("us-east-1");
    }

    @Test
    void isS3StorageEnabled_ShouldReturnConfiguredValue() {
        // Arrange
        when(s3Properties.isEnabled()).thenReturn(true);

        // Act
        boolean result = configurationManager.isS3StorageEnabled();

        // Assert
        assertThat(result).isTrue();
    }

    @Test
    void getSignedUrlExpirationSeconds_ShouldReturnConfiguredValue() {
        // Arrange
        when(s3Properties.getSignedUrlExpirationSeconds()).thenReturn(7200L);

        // Act
        long result = configurationManager.getSignedUrlExpirationSeconds();

        // Assert
        assertThat(result).isEqualTo(7200L);
    }

    @Test
    void getFileTypeFromKey_WithListingMediaKey_ShouldReturnCorrectType() {
        // Arrange
        String storageKey = "listings/123/image.jpg";
        when(keyGenerator.isListingMediaKey(storageKey)).thenReturn(true);

        // Act
        String result = configurationManager.getFileTypeFromKey(storageKey);

        // Assert
        assertThat(result).isEqualTo("listing-media");
    }

    @Test
    void getFileTypeFromKey_WithUserAvatarKey_ShouldReturnCorrectType() {
        // Arrange
        String storageKey = "users/456/avatar.jpg";
        when(keyGenerator.isListingMediaKey(storageKey)).thenReturn(false);
        when(keyGenerator.isUserAvatarKey(storageKey)).thenReturn(true);

        // Act
        String result = configurationManager.getFileTypeFromKey(storageKey);

        // Assert
        assertThat(result).isEqualTo("user-avatar");
    }

    @Test
    void getFileTypeFromKey_WithTempUploadKey_ShouldReturnCorrectType() {
        // Arrange
        String storageKey = "temp/uuid-123_file.pdf";
        when(keyGenerator.isListingMediaKey(storageKey)).thenReturn(false);
        when(keyGenerator.isUserAvatarKey(storageKey)).thenReturn(false);
        when(keyGenerator.isTempUploadKey(storageKey)).thenReturn(true);

        // Act
        String result = configurationManager.getFileTypeFromKey(storageKey);

        // Assert
        assertThat(result).isEqualTo("temp-upload");
    }

    @Test
    void getFileTypeFromKey_WithSampleDataKey_ShouldReturnCorrectType() {
        // Arrange
        String storageKey = "samples/cars/data.json";
        when(keyGenerator.isListingMediaKey(storageKey)).thenReturn(false);
        when(keyGenerator.isUserAvatarKey(storageKey)).thenReturn(false);
        when(keyGenerator.isTempUploadKey(storageKey)).thenReturn(false);

        // Act
        String result = configurationManager.getFileTypeFromKey(storageKey);

        // Assert
        assertThat(result).isEqualTo("sample-data");
    }

    @Test
    void getFileTypeFromKey_WithUnknownKey_ShouldReturnUnknown() {
        // Arrange
        String storageKey = "unknown/path/file.txt";
        when(keyGenerator.isListingMediaKey(storageKey)).thenReturn(false);
        when(keyGenerator.isUserAvatarKey(storageKey)).thenReturn(false);
        when(keyGenerator.isTempUploadKey(storageKey)).thenReturn(false);

        // Act
        String result = configurationManager.getFileTypeFromKey(storageKey);

        // Assert
        assertThat(result).isEqualTo("unknown");
    }

    @Test
    void clearCache_ShouldExecuteWithoutError() {
        // Act & Assert - should not throw any exception
        configurationManager.clearCache();
    }

    @Test
    void getConfigurationSnapshot_ShouldReturnCompleteSnapshot() {
        // Arrange
        lenient().when(s3Properties.getBucketName()).thenReturn("test-bucket");
        lenient().when(generalProperties.isPublicAccessEnabled()).thenReturn(true);
        lenient().when(generalProperties.getBaseUrl()).thenReturn("http://localhost:8080/files");
        lenient().when(s3Properties.getRegion()).thenReturn("us-west-2");
        lenient().when(s3Properties.isEnabled()).thenReturn(true);
        lenient().when(s3Properties.getSignedUrlExpirationSeconds()).thenReturn(3600L);
        lenient().when(s3Properties.getEndpointUrl()).thenReturn("http://localhost:9000");
        lenient().when(s3Properties.isPathStyleAccessEnabled()).thenReturn(true);

        // Act
        Map<String, Object> result = configurationManager.getConfigurationSnapshot();

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).containsKeys(
                "defaultBucketName", 
                "storageBaseUrl", 
                "publicAccessEnabled", 
                "storageRegion", 
                "s3StorageEnabled", 
                "signedUrlExpirationSeconds"
        );
        assertThat(result.get("defaultBucketName")).isEqualTo("test-bucket");
        assertThat(result.get("publicAccessEnabled")).isEqualTo(true);
        assertThat(result.get("storageRegion")).isEqualTo("us-west-2");
        assertThat(result.get("s3StorageEnabled")).isEqualTo(true);
        assertThat(result.get("signedUrlExpirationSeconds")).isEqualTo(3600L);
    }
}
