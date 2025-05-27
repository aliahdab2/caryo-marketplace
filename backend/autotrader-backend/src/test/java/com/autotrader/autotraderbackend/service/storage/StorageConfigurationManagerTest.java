package com.autotrader.autotraderbackend.service.storage;

import com.autotrader.autotraderbackend.config.StorageProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
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
        when(storageProperties.getS3()).thenReturn(s3Properties);
        when(storageProperties.getGeneral()).thenReturn(generalProperties);
        
        configurationManager = new StorageConfigurationManager(storageProperties, keyGenerator);
    }

    @Test
    void getBucketName_WithS3BucketConfigured_ShouldReturnS3Bucket() {
        // Arrange
        when(s3Properties.getBucketName()).thenReturn("s3-production-bucket");
        when(generalProperties.getDefaultBucketName()).thenReturn("default-bucket");

        // Act
        String result = configurationManager.getBucketName("listing-media");

        // Assert
        assertThat(result).isEqualTo("s3-production-bucket");
    }

    @Test
    void getBucketName_WithNullS3Bucket_ShouldReturnDefaultBucket() {
        // Arrange
        when(s3Properties.getBucketName()).thenReturn(null);
        when(generalProperties.getDefaultBucketName()).thenReturn("default-bucket");

        // Act
        String result = configurationManager.getBucketName("listing-media");

        // Assert
        assertThat(result).isEqualTo("default-bucket");
    }

    @Test
    void getStorageKey_ForListingMedia_ShouldDelegateToKeyGenerator() {
        // Arrange
        Long listingId = 123L;
        String filename = "test-image.jpg";
        String expectedKey = "listings/123/20240101_120000_test-image.jpg";
        when(keyGenerator.generateListingMediaKey(listingId, filename)).thenReturn(expectedKey);

        // Act
        String result = configurationManager.getStorageKey("listing-media", listingId, filename);

        // Assert
        assertThat(result).isEqualTo(expectedKey);
        verify(keyGenerator).generateListingMediaKey(listingId, filename);
    }

    @Test
    void getStorageKey_ForUserAvatar_ShouldDelegateToKeyGenerator() {
        // Arrange
        Long userId = 456L;
        String filename = "avatar.png";
        String expectedKey = "users/456/avatar_20240101_120000_avatar.png";
        when(keyGenerator.generateUserAvatarKey(userId, filename)).thenReturn(expectedKey);

        // Act
        String result = configurationManager.getStorageKey("user-avatar", userId, filename);

        // Assert
        assertThat(result).isEqualTo(expectedKey);
        verify(keyGenerator).generateUserAvatarKey(userId, filename);
    }

    @Test
    void getStorageKey_ForTempUpload_ShouldDelegateToKeyGenerator() {
        // Arrange
        String filename = "temp-file.pdf";
        String expectedKey = "temp/uuid-123_temp-file.pdf";
        when(keyGenerator.generateTempUploadKey(filename)).thenReturn(expectedKey);

        // Act
        String result = configurationManager.getStorageKey("temp-upload", filename);

        // Assert
        assertThat(result).isEqualTo(expectedKey);
        verify(keyGenerator).generateTempUploadKey(filename);
    }

    @Test
    void getStorageKey_ForDocument_ShouldDelegateToKeyGenerator() {
        // Arrange
        String category = "contracts";
        String filename = "agreement.pdf";
        String expectedKey = "documents/contracts/20240101_120000_agreement.pdf";
        when(keyGenerator.generateDocumentKey(category, filename)).thenReturn(expectedKey);

        // Act
        String result = configurationManager.getStorageKey("document", category, filename);

        // Assert
        assertThat(result).isEqualTo(expectedKey);
        verify(keyGenerator).generateDocumentKey(category, filename);
    }

    @Test
    void getStorageKey_ForSampleData_ShouldDelegateToKeyGenerator() {
        // Arrange
        String category = "cars";
        String filename = "sample-data.json";
        String expectedKey = "samples/cars/sample-data.json";
        when(keyGenerator.generateSampleDataKey(category, filename)).thenReturn(expectedKey);

        // Act
        String result = configurationManager.getStorageKey("sample-data", category, filename);

        // Assert
        assertThat(result).isEqualTo(expectedKey);
        verify(keyGenerator).generateSampleDataKey(category, filename);
    }

    @Test
    void getStorageKey_WithUnsupportedType_ShouldThrowException() {
        // Act & Assert
        assertThatThrownBy(() -> configurationManager.getStorageKey("unsupported-type", "param1", "param2"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Unsupported storage key type: unsupported-type");
    }

    @Test
    void getStorageKey_WithNullType_ShouldThrowException() {
        // Act & Assert
        assertThatThrownBy(() -> configurationManager.getStorageKey(null, "param1", "param2"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Storage key type cannot be null or blank");
    }

    @Test
    void getStorageKey_WithBlankType_ShouldThrowException() {
        // Act & Assert
        assertThatThrownBy(() -> configurationManager.getStorageKey("  ", "param1", "param2"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Storage key type cannot be null or blank");
    }

    @Test
    void isFilePubliclyAccessible_WithPublicFileType_ShouldReturnTrue() {
        // Arrange
        when(generalProperties.isPublicAccessEnabled()).thenReturn(true);

        // Act
        boolean result = configurationManager.isFilePubliclyAccessible("listing-media");

        // Assert
        assertThat(result).isTrue();
    }

    @Test
    void isFilePubliclyAccessible_WithPublicAccessDisabled_ShouldReturnFalse() {
        // Arrange
        when(generalProperties.isPublicAccessEnabled()).thenReturn(false);

        // Act
        boolean result = configurationManager.isFilePubliclyAccessible("listing-media");

        // Assert
        assertThat(result).isFalse();
    }

    @Test
    void isFilePubliclyAccessible_WithPrivateFileType_ShouldReturnFalse() {
        // Arrange
        when(generalProperties.isPublicAccessEnabled()).thenReturn(true);

        // Act
        boolean result = configurationManager.isFilePubliclyAccessible("document");

        // Assert
        assertThat(result).isFalse();
    }

    @Test
    void getDefaultRegion_ShouldReturnConfiguredRegion() {
        // Arrange
        when(generalProperties.getDefaultRegion()).thenReturn("us-west-2");

        // Act
        String result = configurationManager.getDefaultRegion();

        // Assert
        assertThat(result).isEqualTo("us-west-2");
    }

    @Test
    void getMaxFileSize_ForImages_ShouldReturnCorrectLimit() {
        // Act
        long result = configurationManager.getMaxFileSize("image");

        // Assert
        assertThat(result).isEqualTo(10L * 1024 * 1024); // 10MB
    }

    @Test
    void getMaxFileSize_ForDocuments_ShouldReturnCorrectLimit() {
        // Act
        long result = configurationManager.getMaxFileSize("document");

        // Assert
        assertThat(result).isEqualTo(50L * 1024 * 1024); // 50MB
    }

    @Test
    void getMaxFileSize_ForVideos_ShouldReturnCorrectLimit() {
        // Act
        long result = configurationManager.getMaxFileSize("video");

        // Assert
        assertThat(result).isEqualTo(500L * 1024 * 1024); // 500MB
    }

    @Test
    void getMaxFileSize_ForUnknownType_ShouldReturnDefaultLimit() {
        // Act
        long result = configurationManager.getMaxFileSize("unknown");

        // Assert
        assertThat(result).isEqualTo(5L * 1024 * 1024); // 5MB default
    }

    @Test
    void getAllowedContentTypes_ForImages_ShouldReturnImageTypes() {
        // Act
        String[] result = configurationManager.getAllowedContentTypes("image");

        // Assert
        assertThat(result).containsExactlyInAnyOrder(
                "image/jpeg", "image/png", "image/gif", "image/webp"
        );
    }

    @Test
    void getAllowedContentTypes_ForDocuments_ShouldReturnDocumentTypes() {
        // Act
        String[] result = configurationManager.getAllowedContentTypes("document");

        // Assert
        assertThat(result).containsExactlyInAnyOrder(
                "application/pdf", "application/msword", 
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        );
    }

    @Test
    void getAllowedContentTypes_ForUnknownType_ShouldReturnEmpty() {
        // Act
        String[] result = configurationManager.getAllowedContentTypes("unknown");

        // Assert
        assertThat(result).isEmpty();
    }

    @Test
    void isContentTypeAllowed_WithAllowedType_ShouldReturnTrue() {
        // Act
        boolean result = configurationManager.isContentTypeAllowed("image", "image/jpeg");

        // Assert
        assertThat(result).isTrue();
    }

    @Test
    void isContentTypeAllowed_WithDisallowedType_ShouldReturnFalse() {
        // Act
        boolean result = configurationManager.isContentTypeAllowed("image", "application/pdf");

        // Assert
        assertThat(result).isFalse();
    }

    @Test
    void isContentTypeAllowed_WithNullContentType_ShouldReturnFalse() {
        // Act
        boolean result = configurationManager.isContentTypeAllowed("image", null);

        // Assert
        assertThat(result).isFalse();
    }

    @Test
    void getStorageProvider_ShouldReturnCurrentProvider() {
        // Act
        String result = configurationManager.getStorageProvider();

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).isIn("s3", "minio", "local", "gcs", "azure");
    }

    @Test
    void isCacheEnabled_ShouldReturnCacheStatus() {
        // Act
        boolean result = configurationManager.isCacheEnabled();

        // Assert
        assertThat(result).isNotNull();
    }

    @Test
    void getCacheConfiguration_ShouldReturnValidConfig() {
        // Act
        String result = configurationManager.getCacheConfiguration();

        // Assert
        assertThat(result).isNotNull();
    }
}
