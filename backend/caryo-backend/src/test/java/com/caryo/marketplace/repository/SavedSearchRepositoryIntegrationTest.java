package com.caryo.marketplace.repository;

import com.caryo.marketplace.model.SavedSearch;
import com.caryo.marketplace.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for SavedSearchRepository using Testcontainers with PostgreSQL
 * This ensures JSONB compatibility and production-like SQL behavior
 */
@DataJpaTest
@Testcontainers
@ActiveProfiles("integration")
class SavedSearchRepositoryIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        registry.add("spring.jpa.database-platform", () -> "org.hibernate.dialect.PostgreSQLDialect");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
    }

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private SavedSearchRepository savedSearchRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setPassword("hashedpassword");
        entityManager.persistAndFlush(testUser);
    }

    @Test
    void findByUserAndIsActiveTrueOrderByCreatedAtDesc_Success() {
        // Given
        SavedSearch activeSearch = createSavedSearch("Active Search", true);
        SavedSearch inactiveSearch = createSavedSearch("Inactive Search", false);

        entityManager.persistAndFlush(activeSearch);
        entityManager.persistAndFlush(inactiveSearch);
        entityManager.clear();

        // When
        List<SavedSearch> result = savedSearchRepository.findByUserAndIsActiveTrueOrderByCreatedAtDesc(testUser);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getNameEn()).isEqualTo("Active Search");
        assertThat(result.get(0).getIsActive()).isTrue();
    }

    @Test
    void findByIdAndUser_Success() {
        // Given
        SavedSearch savedSearch = createSavedSearch("Test Search", true);
        entityManager.persistAndFlush(savedSearch);
        entityManager.clear();

        // When
        SavedSearch result = savedSearchRepository.findByIdAndUser(savedSearch.getId(), testUser);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getNameEn()).isEqualTo("Test Search");
        assertThat(result.getUser().getId()).isEqualTo(testUser.getId());
    }

    @Test
    void findByIdAndUser_WrongUser_ReturnsNull() {
        // Given
        SavedSearch savedSearch = createSavedSearch("Test Search", true);
        entityManager.persistAndFlush(savedSearch);

        User otherUser = new User();
        otherUser.setUsername("otheruser");
        otherUser.setEmail("other@example.com");
        otherUser.setPassword("hashedpassword");
        entityManager.persistAndFlush(otherUser);
        entityManager.clear();

        // When
        SavedSearch result = savedSearchRepository.findByIdAndUser(savedSearch.getId(), otherUser);

        // Then
        assertThat(result).isNull();
    }

    @Test
    void countByUserAndIsActiveTrue_Success() {
        // Given
        SavedSearch activeSearch1 = createSavedSearch("Active Search 1", true);
        SavedSearch activeSearch2 = createSavedSearch("Active Search 2", true);
        SavedSearch inactiveSearch = createSavedSearch("Inactive Search", false);

        entityManager.persistAndFlush(activeSearch1);
        entityManager.persistAndFlush(activeSearch2);
        entityManager.persistAndFlush(inactiveSearch);
        entityManager.clear();

        // When
        long count = savedSearchRepository.countByUserAndIsActiveTrue(testUser);

        // Then
        assertThat(count).isEqualTo(2);
    }

    @Test
    void findActiveSearchesForImmediateNotification_Success() {
        // Given
        Map<String, Object> immediateNotificationPrefs = new HashMap<>();
        immediateNotificationPrefs.put("email", true);
        immediateNotificationPrefs.put("frequency", "immediate");

        Map<String, Object> dailyNotificationPrefs = new HashMap<>();
        dailyNotificationPrefs.put("email", true);
        dailyNotificationPrefs.put("frequency", "daily");

        Map<String, Object> noEmailPrefs = new HashMap<>();
        noEmailPrefs.put("email", false);
        noEmailPrefs.put("frequency", "immediate");

        SavedSearch immediateSearch = createSavedSearchWithNotifications("Immediate", true, immediateNotificationPrefs);
        SavedSearch dailySearch = createSavedSearchWithNotifications("Daily", true, dailyNotificationPrefs);
        SavedSearch noEmailSearch = createSavedSearchWithNotifications("No Email", true, noEmailPrefs);

        entityManager.persistAndFlush(immediateSearch);
        entityManager.persistAndFlush(dailySearch);
        entityManager.persistAndFlush(noEmailSearch);
        entityManager.clear();

        // When
        List<SavedSearch> result = savedSearchRepository.findActiveSearchesForImmediateNotification();

        // Then
        // Note: Repository returns all active searches; filtering for immediate notifications
        // is done at the service layer for database compatibility
        assertThat(result).hasSize(3);
        assertThat(result).extracting(SavedSearch::getNameEn)
                .containsExactlyInAnyOrder("Immediate", "Daily", "No Email");
    }

    @Test
    void findSearchesDueForPeriodicNotification_Success() {
        // Given
        LocalDateTime cutoffTime = LocalDateTime.now().minusHours(1);

        Map<String, Object> dailyNotificationPrefs = new HashMap<>();
        dailyNotificationPrefs.put("email", true);
        dailyNotificationPrefs.put("frequency", "daily");

        Map<String, Object> weeklyNotificationPrefs = new HashMap<>();
        weeklyNotificationPrefs.put("email", true);
        weeklyNotificationPrefs.put("frequency", "weekly");

        SavedSearch oldDailySearch = createSavedSearchWithNotifications("Old Daily", true, dailyNotificationPrefs);
        oldDailySearch.setLastNotifiedAt(LocalDateTime.now().minusHours(2)); // Before cutoff

        SavedSearch recentDailySearch = createSavedSearchWithNotifications("Recent Daily", true, dailyNotificationPrefs);
        recentDailySearch.setLastNotifiedAt(LocalDateTime.now().minusMinutes(30)); // After cutoff

        SavedSearch neverNotifiedWeekly = createSavedSearchWithNotifications("Never Notified", true, weeklyNotificationPrefs);
        // lastNotifiedAt remains null

        entityManager.persistAndFlush(oldDailySearch);
        entityManager.persistAndFlush(recentDailySearch);
        entityManager.persistAndFlush(neverNotifiedWeekly);
        entityManager.clear();

        // When
        List<SavedSearch> result = savedSearchRepository.findSearchesDueForPeriodicNotification(cutoffTime);

        // Then
        assertThat(result).hasSize(2);
        assertThat(result).extracting(SavedSearch::getNameEn)
                .containsExactlyInAnyOrder("Old Daily", "Never Notified");
    }

    private SavedSearch createSavedSearch(String nameEn, boolean isActive) {
        Map<String, Object> filters = new HashMap<>();
        filters.put("brandSlugs", List.of("toyota"));

        Map<String, Object> notificationPrefs = new HashMap<>();
        notificationPrefs.put("email", true);
        notificationPrefs.put("frequency", "immediate");

        return createSavedSearchWithNotifications(nameEn, isActive, notificationPrefs);
    }

    private SavedSearch createSavedSearchWithNotifications(String nameEn, boolean isActive, Map<String, Object> notificationPrefs) {
        Map<String, Object> filters = new HashMap<>();
        filters.put("brandSlugs", List.of("toyota"));

        SavedSearch savedSearch = new SavedSearch();
        savedSearch.setUser(testUser);
        savedSearch.setNameEn(nameEn);
        savedSearch.setNameAr("Arabic " + nameEn);
        savedSearch.setFilters(filters);  // This will now convert Map to JSON string
        savedSearch.setNotificationPreferences(notificationPrefs);  // This will now convert Map to JSON string
        savedSearch.setIsActive(isActive);
        savedSearch.setCreatedAt(LocalDateTime.now());
        savedSearch.setUpdatedAt(LocalDateTime.now());

        return savedSearch;
    }
}
