package com.autotrader.autotraderbackend.service.storage;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

class NoOpStorageServiceTest {

    private NoOpStorageService storageService;

    @Mock
    private MultipartFile mockFile;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        storageService = new NoOpStorageService();
    }

    @Test
    void init_ShouldExecuteWithoutException() {
        // Act & Assert
        assertThatCode(() -> storageService.init())
                .doesNotThrowAnyException();
    }

    @Test
    void store_ShouldReturnProvidedKey() {
        // Arrange
        String expectedKey = "test-key";

        // Act
        String result = storageService.store(mockFile, expectedKey);

        // Assert
        assertThat(result).isEqualTo(expectedKey);
    }

    @Test
    void store_WithNullKey_ShouldReturnNull() {
        // Act
        String result = storageService.store(mockFile, null);

        // Assert
        assertThat(result).isNull();
    }

    @Test
    void store_WithNullFile_ShouldReturnKey() {
        // Arrange
        String expectedKey = "test-key";

        // Act
        String result = storageService.store(null, expectedKey);

        // Assert
        assertThat(result).isEqualTo(expectedKey);
    }

    @Test
    void loadAll_ShouldReturnEmptyStream() {
        // Act
        Stream<Path> result = storageService.loadAll();

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.count()).isZero();
    }

    @Test
    void load_ShouldReturnNull() {
        // Act
        Path result = storageService.load("any-filename");

        // Assert
        assertThat(result).isNull();
    }

    @Test
    void load_WithNullFilename_ShouldReturnNull() {
        // Act
        Path result = storageService.load(null);

        // Assert
        assertThat(result).isNull();
    }

    @Test
    void loadAsResource_ShouldReturnNull() {
        // Act
        Resource result = storageService.loadAsResource("any-filename");

        // Assert
        assertThat(result).isNull();
    }

    @Test
    void loadAsResource_WithNullFilename_ShouldReturnNull() {
        // Act
        Resource result = storageService.loadAsResource(null);

        // Assert
        assertThat(result).isNull();
    }

    @Test
    void deleteAll_ShouldExecuteWithoutException() {
        // Act & Assert
        assertThatCode(() -> storageService.deleteAll())
                .doesNotThrowAnyException();
    }

    @Test
    void delete_ShouldReturnTrueRegardlessOfKey() {
        // Act
        boolean result = storageService.delete("any-key");

        // Assert
        assertThat(result).isTrue();
    }

    @Test
    void delete_WithNullKey_ShouldReturnTrue() {
        // Act
        boolean result = storageService.delete(null);

        // Assert
        assertThat(result).isTrue();
    }

    @Test
    void getSignedUrl_ShouldReturnDummyUrl() {
        // Act
        String result = storageService.getSignedUrl("test-key", 3600L);

        // Assert
        assertThat(result).isEqualTo("http://localhost/noop/test-key");
    }

    @Test
    void getSignedUrl_WithNullKey_ShouldReturnDummyUrl() {
        // Act
        String result = storageService.getSignedUrl(null, 3600L);

        // Assert
        assertThat(result).isEqualTo("http://localhost/noop/null");
    }

    @Test
    void getSignedUrl_WithZeroExpiration_ShouldReturnDummyUrl() {
        // Act
        String result = storageService.getSignedUrl("test-key", 0L);

        // Assert
        assertThat(result).isEqualTo("http://localhost/noop/test-key");
    }

    @Test
    void getSignedUrl_WithNegativeExpiration_ShouldReturnDummyUrl() {
        // Act
        String result = storageService.getSignedUrl("test-key", -100L);

        // Assert
        assertThat(result).isEqualTo("http://localhost/noop/test-key");
    }
}
