package com.autotrader.autotraderbackend.repository;

import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.model.UserReport;
import com.autotrader.autotraderbackend.model.UserReport.ReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for UserReport entities.
 */
@Repository
public interface UserReportRepository extends JpaRepository<UserReport, Long> {

    /**
     * Find all reports by status
     */
    Page<UserReport> findByStatusOrderByCreatedAtDesc(ReportStatus status, Pageable pageable);

    /**
     * Find reports submitted by a specific user
     */
    Page<UserReport> findByReporterOrderByCreatedAtDesc(User reporter, Pageable pageable);

    /**
     * Find reports against a specific user
     */
    Page<UserReport> findByReportedUserOrderByCreatedAtDesc(User reportedUser, Pageable pageable);

    /**
     * Check if user has already reported another user (to prevent duplicate reports)
     */
    @Query("SELECT COUNT(r) > 0 FROM UserReport r WHERE r.reporter = :reporter AND r.reportedUser = :reportedUser AND r.status = 'PENDING'")
    boolean existsPendingReportByReporterAndReportedUser(@Param("reporter") User reporter, @Param("reportedUser") User reportedUser);

    /**
     * Find all pending reports
     */
    List<UserReport> findByStatusOrderByCreatedAtAsc(ReportStatus status);
}
