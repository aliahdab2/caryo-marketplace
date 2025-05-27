package com.autotrader.autotraderbackend.service.storage;

import com.autotrader.autotraderbackend.config.StorageProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StorageKeyGeneratorTest {

    @Mock
    private StorageProperties storageProperties;

    @Mock
    private StorageProperties.KeyPatterns keyPatterns;

    @Mock
    private StorageProperties.General general;

    @Mock
    private StorageProperties.S3 s3;

    private StorageKeyGenerator storageKeyGenerator;

    @BeforeEach
    void setUp() {
        when(storageProperties.getKeyPatterns()).thenReturn(keyPatterns);
        when(storageProperties.getGeneral()).thenReturn(general);
        when(storageProperties.getS3()).thenReturn(s3);
        
        // Default patterns (matching actual StorageProperties)
        when(keyPatterns.getListingMedia()).thenReturn("listings/{listingId}/{timestamp}_{filename}");
        when(keyPatterns.getUserAvatar()).thenReturn("users/{userId}/avatar_{timestamp}_{filename}");
        when(keyPatterns.getTempUploads()).thenReturn("temp/{uuid}_{filename}");
        when(keyPatterns.getSampleData()).thenReturn("samples/{category}/{filename}");
        when(keyPatterns.getDocuments()).thenReturn("documents/{category}/{timestamp}_{filename}");
        when(keyPatterns.getThumbnails()).thenReturn("thumbnails/{originalPath}/{filename}");
        when(keyPatterns.getBackups()).thenReturn("backups/{date}/{category}/{filename}");
        when(keyPatterns.getLogs()).thenReturn("logs/{date}/{level}/{filename}");
        
        // Default bucket names
        when(general.getDefaultBucketName()).thenReturn("app-assets");
        when(s3.getBucketName()).thenReturn("production-bucket");
        
        storageKeyGenerator = new StorageKeyGenerator(storageProperties);
    }

    @Test
    void generateListingMediaKey_WithValidInputs_ShouldGenerateCorrectKey() {
        // Arrange
        Long listingId = 123L;
        String originalFilename = "test-image.jpg";

        // Act
        String result = storageKeyGenerator.generateListingMediaKey(listingId, originalFilename);

        // Assert
        assertThat(result).startsWith("listings/123/");
        assertThat(result).endsWith("_test_image_jpg");
        assertThat(result).matches("listings/123/\\d{8}_\\d{6}_test_image_jpg");
    }

    @Test
    void generateListingMediaKey_WithNullFilename_ShouldGenerateSafeKey() {
        // Arrange
        Long listingId = 456L;

        // Act
        String result = storageKeyGenerator.generateListingMediaKey(listingId, null);

        // Assert
        assertThat(result).startsWith("listings/456/");
        assertThat(result).endsWith("_file");
        assertThat(result).matches("listings/456/\\d{8}_\\d{6}_file");
    }

    @Test
    void generateListingMediaKey_WithEmptyFilename_ShouldGenerateSafeKey() {
        // Arrange
        Long listingId = 789L;

        // Act
        String result = storageKeyGenerator.generateListingMediaKey(listingId, "");

        // Assert
        assertThat(result).startsWith("listings/789/");
        assertThat(result).endsWith("_file");
    }

    @Test
    void generateListingMediaKey_WithUnsafeFilename_ShouldSanitize() {
        // Arrange
        Long listingId = 101L;
        String unsafeFilename = "test file with spaces & special chars!@#.jpg";

        // Act
        String result = storageKeyGenerator.generateListingMediaKey(listingId, unsafeFilename);

        // Assert
        assertThat(result).startsWith("listings/101/");
        assertThat(result).endsWith("_test_file_with_spaces___special_chars____jpg");
        assertThat(result).doesNotContain(" ", "&", "!", "@", "#");
    }

    @Test
    void generateUserAvatarKey_WithValidInputs_ShouldGenerateCorrectKey() {
        // Arrange
        Long userId = 555L;
        String originalFilename = "avatar.png";

        // Act
        String result = storageKeyGenerator.generateUserAvatarKey(userId, originalFilename);

        // Assert
        assertThat(result).startsWith("users/555/avatar_");
        assertThat(result).endsWith("_avatar_png");
        assertThat(result).matches("users/555/avatar_\\d{8}_\\d{6}_avatar_png");
    }

    @Test
    void generateTempUploadKey_WithValidInputs_ShouldGenerateCorrectKey() {
        // Arrange
        String originalFilename = "temp-file.pdf";

        // Act
        String result = storageKeyGenerator.generateTempUploadKey(originalFilename);

        // Assert
        assertThat(result).startsWith("temp/");
        assertThat(result).endsWith("_temp_file_pdf");
        assertThat(result).matches("temp/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}_temp_file_pdf");
    }

    @Test
    void generateSampleDataKey_WithValidInputs_ShouldGenerateCorrectKey() {
        // Arrange
        String category = "cars";
        String filename = "sample-car.json";

        // Act
        String result = storageKeyGenerator.generateSampleDataKey(category, filename);

        // Assert
        assertThat(result).isEqualTo("samples/cars/sample_car_json");
    }

    @Test
    void generateDocumentKey_WithValidInputs_ShouldGenerateCorrectKey() {
        // Arrange
        String category = "contracts";
        String filename = "agreement.pdf";

        // Act
        String result = storageKeyGenerator.generateDocumentKey(category, filename);

        // Assert
        assertThat(result).startsWith("documents/contracts/");
        assertThat(result).endsWith("_agreement_pdf");
        assertThat(result).matches("documents/contracts/\\d{8}_\\d{6}_agreement_pdf");
    }

    @Test
    void generateThumbnailKey_WithValidInputs_ShouldGenerateCorrectKey() {
        // Arrange
        String originalPath = "listings/123/image.jpg";
        String filename = "thumb_image.jpg";

        // Act
        String result = storageKeyGenerator.generateThumbnailKey(originalPath, filename);

        // Assert
        assertThat(result).isEqualTo("thumbnails/listings_123_image_jpg/thumb_image_jpg");
    }

    @Test
    void generateBackupKey_WithValidInputs_ShouldGenerateCorrectKey() {
        // Arrange
        String category = "database";
        String filename = "backup.sql";

        // Act
        String result = storageKeyGenerator.generateBackupKey(category, filename);

        // Assert
        assertThat(result).startsWith("backups/");
        assertThat(result).contains("/database/");
        assertThat(result).endsWith("backup_sql");
        assertThat(result).matches("backups/\\d{4}-\\d{2}-\\d{2}/database/backup_sql");
    }

    @Test
    void generateLogKey_WithValidInputs_ShouldGenerateCorrectKey() {
        // Arrange
        String level = "ERROR";
        String filename = "error.log";

        // Act
        String result = storageKeyGenerator.generateLogKey(level, filename);

        // Assert
        assertThat(result).startsWith("logs/");
        assertThat(result).contains("/ERROR/");
        assertThat(result).endsWith("error_log");
        assertThat(result).matches("logs/\\d{4}-\\d{2}-\\d{2}/ERROR/error_log");
    }

    @Test
    void generateCustomKey_WithValidReplacements_ShouldGenerateCorrectKey() {
        // Arrange
        String pattern = "custom/{category}/{id}_{filename}";
        String[] replacements = {"category", "images", "id", "123", "filename", "test.jpg"};

        // Act
        String result = storageKeyGenerator.generateCustomKey(pattern, replacements);

        // Assert
        assertThat(result).isEqualTo("custom/images/123_test_jpg");
    }

    @Test
    void generateCustomKey_WithOddNumberOfReplacements_ShouldThrowException() {
        // Arrange
        String pattern = "custom/{category}/{filename}";
        String[] invalidReplacements = {"category", "images", "filename"}; // Missing value for filename

        // Act & Assert
        assertThatThrownBy(() -> storageKeyGenerator.generateCustomKey(pattern, invalidReplacements))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Replacements must be provided in key-value pairs");
    }

    @Test
    void getDirectoryPath_WithValidKey_ShouldReturnDirectory() {
        // Arrange
        String storageKey = "listings/123/20240101_120000_image.jpg";

        // Act
        String result = storageKeyGenerator.getDirectoryPath(storageKey);

        // Assert
        assertThat(result).isEqualTo("listings/123");
    }

    @Test
    void getDirectoryPath_WithNoSlashes_ShouldReturnEmpty() {
        // Arrange
        String storageKey = "filename.jpg";

        // Act
        String result = storageKeyGenerator.getDirectoryPath(storageKey);

        // Assert
        assertThat(result).isEmpty();
    }

    @Test
    void getFilename_WithValidKey_ShouldReturnFilename() {
        // Arrange
        String storageKey = "listings/123/20240101_120000_image.jpg";

        // Act
        String result = storageKeyGenerator.getFilename(storageKey);

        // Assert
        assertThat(result).isEqualTo("20240101_120000_image.jpg");
    }

    @Test
    void getFilename_WithNoSlashes_ShouldReturnFullKey() {
        // Arrange
        String storageKey = "filename.jpg";

        // Act
        String result = storageKeyGenerator.getFilename(storageKey);

        // Assert
        assertThat(result).isEqualTo("filename.jpg");
    }

    @Test
    void isKeyOfType_WithMatchingPrefix_ShouldReturnTrue() {
        // Arrange
        String storageKey = "listings/123/image.jpg";
        String prefix = "listings/";

        // Act
        boolean result = storageKeyGenerator.isKeyOfType(storageKey, prefix);

        // Assert
        assertThat(result).isTrue();
    }

    @Test
    void isKeyOfType_WithNonMatchingPrefix_ShouldReturnFalse() {
        // Arrange
        String storageKey = "users/456/avatar.jpg";
        String prefix = "listings/";

        // Act
        boolean result = storageKeyGenerator.isKeyOfType(storageKey, prefix);

        // Assert
        assertThat(result).isFalse();
    }

    @Test
    void isKeyOfType_WithNullKey_ShouldReturnFalse() {
        // Arrange
        String prefix = "listings/";

        // Act
        boolean result = storageKeyGenerator.isKeyOfType(null, prefix);

        // Assert
        assertThat(result).isFalse();
    }

    @Test
    void getDefaultBucketName_ShouldReturnConfiguredValue() {
        // Act
        String result = storageKeyGenerator.getDefaultBucketName();

        // Assert
        assertThat(result).isEqualTo("app-assets");
    }

    @Test
    void getS3BucketName_ShouldReturnConfiguredValue() {
        // Act
        String result = storageKeyGenerator.getS3BucketName();

        // Assert
        assertThat(result).isEqualTo("production-bucket");
    }

    @Test
    void isListingMediaKey_WithListingMediaKey_ShouldReturnTrue() {
        // Arrange
        String storageKey = "listings/123/image.jpg";

        // Act
        boolean result = storageKeyGenerator.isListingMediaKey(storageKey);

        // Assert
        assertThat(result).isTrue();
    }

    @Test
    void isListingMediaKey_WithNonListingMediaKey_ShouldReturnFalse() {
        // Arrange
        String storageKey = "users/456/avatar.jpg";

        // Act
        boolean result = storageKeyGenerator.isListingMediaKey(storageKey);

        // Assert
        assertThat(result).isFalse();
    }

    @Test
    void isUserAvatarKey_WithUserAvatarKey_ShouldReturnTrue() {
        // Arrange
        String storageKey = "users/456/avatar_image.jpg";

        // Act
        boolean result = storageKeyGenerator.isUserAvatarKey(storageKey);

        // Assert
        assertThat(result).isTrue();
    }

    @Test
    void isUserAvatarKey_WithNonUserAvatarKey_ShouldReturnFalse() {
        // Arrange
        String storageKey = "listings/123/image.jpg";

        // Act
        boolean result = storageKeyGenerator.isUserAvatarKey(storageKey);

        // Assert
        assertThat(result).isFalse();
    }

    @Test
    void isTempUploadKey_WithTempUploadKey_ShouldReturnTrue() {
        // Arrange
        String storageKey = "temp/uuid-123_file.pdf";

        // Act
        boolean result = storageKeyGenerator.isTempUploadKey(storageKey);

        // Assert
        assertThat(result).isTrue();
    }

    @Test
    void isTempUploadKey_WithNonTempUploadKey_ShouldReturnFalse() {
        // Arrange
        String storageKey = "listings/123/image.jpg";

        // Act
        boolean result = storageKeyGenerator.isTempUploadKey(storageKey);

        // Assert
        assertThat(result).isFalse();
    }
}
