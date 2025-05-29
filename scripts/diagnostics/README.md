# Diagnostic Scripts

This directory contains scripts for diagnosing issues in the Caryo Marketplace application.

## Available Scripts

| Script | Description |
|--------|-------------|
| `diagnose-api.sh` | Performs comprehensive API diagnostics including endpoint health checks, authentication flows, and error reporting. |
| `diagnose-postman-tests.sh` | Diagnoses issues with Postman API tests, particularly in CI environments. |
| `diagnose-spring-boot.sh` | Helps diagnose Spring Boot startup issues and runtime errors. |
| `diagnose-user-auth.sh` | Specifically tests and diagnoses authentication and authorization flows. |

## Usage Examples

```bash
# Diagnose API issues
./scripts/diagnostics/diagnose-api.sh http://localhost:8080

# Diagnose Postman test failures
./scripts/diagnostics/diagnose-postman-tests.sh
```

For general script documentation, see the main [README.md](../README.md).
