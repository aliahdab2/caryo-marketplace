---
name: new-endpoint
description: Scaffold a full-stack API endpoint — controller, service, repository, DTOs, and tests
user-invocable: true
---

# Full-Stack Endpoint Scaffolding

## Project Architecture (Layered)

```
Controller → Service → Repository → Entity
    ↕            ↕
  DTOs      Exceptions
(payload/)  (exception/)
```

## Base Package

```
backend/caryo-backend/src/main/java/com/caryo/caryomarketplace/
```

## Step-by-Step

### 1. Entity (if new table needed)

Location: `model/YourEntity.java`

```java
@Entity
@Table(name = "your_table")
@Getter @Setter
public class YourEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // fields...

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() { createdAt = updatedAt = Instant.now(); }

    @PreUpdate
    protected void onUpdate() { updatedAt = Instant.now(); }
}
```

### 2. Repository

Location: `repository/YourEntityRepository.java`

```java
@Repository
public interface YourEntityRepository extends JpaRepository<YourEntity, Long> {
    // custom queries
}
```

### 3. DTOs

Location: `payload/request/YourRequest.java` and `payload/response/YourResponse.java`

- Use **Jakarta validation** annotations on request DTOs
- Keep response DTOs flat — no entity leakage

### 4. Service

Location: `service/YourService.java`

```java
@Service
@RequiredArgsConstructor
public class YourService {
    private final YourEntityRepository repository;

    public YourResponse create(YourRequest request) { ... }
    public YourResponse getById(Long id) {
        return repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("YourEntity", "id", id));
    }
}
```

### 5. Controller

Location: `controller/YourController.java`

```java
@RestController
@RequestMapping("/api/your-resource")
@RequiredArgsConstructor
@Tag(name = "Your Resource")
public class YourController {
    private final YourService service;

    @GetMapping("/{id}")
    @Operation(summary = "Get by ID")
    public ResponseEntity<YourResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @Operation(summary = "Create")
    public ResponseEntity<YourResponse> create(
            @Valid @RequestBody YourRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.create(request));
    }
}
```

### 6. Exception Handling

Use existing exceptions in `exception/` package:
- `ResourceNotFoundException` — 404
- `BadRequestException` — 400
- All handled by `GlobalExceptionHandler` returning `ErrorResponse`

### 7. Flyway Migration

Use the `/new-migration` skill to create the database migration.

### 8. Tests

- **Unit tests**: `src/test/java/.../service/YourServiceTest.java` — mock the repository
- **Integration tests**: `src/test/java/.../controller/YourControllerIntegrationTest.java` — use `@SpringBootTest` + Testcontainers (NOT H2)
- Run: `cd backend/caryo-backend && ./gradlew test --no-daemon`

## Conventions

- REST paths: plural nouns, kebab-case (`/api/user-reports`)
- HTTP methods: GET (read), POST (create), PUT (full update), PATCH (partial), DELETE
- Always return proper status codes: 200, 201, 204, 400, 401, 403, 404
- Add `@Operation` and `@Tag` OpenAPI annotations
- Use `@Valid` on request body parameters
