# File Cleanup Strategies for AutoTrader Marketplace

This document outlines the possible strategies for cleaning up old or unreferenced files in the S3 storage system. Each approach has its own trade-offs in terms of complexity, safety, and automation.

## 1. Event-Driven Cleanup (On Delete/Update)
- **Description:** Delete files from S3 immediately when their database reference (e.g., ListingMedia) is deleted or updated.
- **Pros:** Simple, immediate, low risk of deleting in-use files, minimal S3/database load.
- **Cons:** Orphans may remain if deletions happen outside normal flows or due to bugs. Can be combined with a periodic batch scan as a safety net.

## 2. Scheduled Batch Scan (Compare DB and S3)
- **Description:** Periodically scan all S3 objects and compare with database references. Delete any S3 files not referenced in the database.
- **Pros:** Catches all orphans, even those missed by bugs or manual DB changes.
- **Cons:** Can be slow/expensive for large buckets, more complex to implement efficiently.

## 3. Reference Counting (Mark-and-Sweep)
- **Description:** Maintain a table of all uploaded files with a reference flag or count. Mark files as unreferenced when not used, and periodically delete those unreferenced for a grace period.
- **Pros:** Very safe, scalable, and auditable. Grace period prevents accidental deletion.
- **Cons:** More complex schema and logic.

## 4. S3 Lifecycle Rules
- **Description:** Use S3’s built-in lifecycle management to automatically delete files in certain prefixes after a set period.
- **Pros:** Zero backend code, managed by AWS, great for temp/unreferenced uploads.
- **Cons:** Not suitable for files that become orphaned after being referenced.

## 5. Soft Delete with Grace Period
- **Description:** Mark files as "to be deleted" in the database, and only physically delete after a grace period.
- **Pros:** Provides a safety window for accidental deletions, easy to audit.
- **Cons:** Requires schema change and a cleanup job.

## 6. S3 Event Notifications
- **Description:** Use S3 event notifications to trigger cleanup logic or update the database when objects are created or deleted.
- **Pros:** Real-time, scalable, decoupled.
- **Cons:** More complex infrastructure (requires SQS/Lambda or similar).

## 7. Manual/Admin Review
- **Description:** Provide an admin UI or API to list orphaned files and allow manual deletion.
- **Pros:** Human oversight, useful for critical data.
- **Cons:** Not automated, requires manual intervention.

---

## Recommendation

For most CRUD-based applications:
- **Primary:** Use event-driven cleanup (delete from S3 when a record is deleted/updated).
- **Safety Net:** Add a scheduled batch scan (e.g., monthly) to catch any missed orphans.
- **Optional:** Use S3 lifecycle rules for temporary uploads.

For maximum safety and auditability, consider the reference counting approach.

---

## References

- [AWS S3 Lifecycle Management](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)
- [Spring Scheduling Documentation](https://docs.spring.io/spring-framework/docs/current/reference/html/integration.html#scheduling)
