# Testing Scripts

This directory contains scripts for testing the Caryo Marketplace application.

## Available Scripts

| Script | Description |
|--------|-------------|
| `run-postman-tests-with-no-auth.sh` | Runs Postman tests that don't require authentication. |
| `test-auth-paths.sh` | Tests various authentication paths and scenarios. |
| `mock-spring-boot.sh` | Creates a mock Spring Boot server for testing purposes. |
| `test-docker-compose.yml` | A Docker Compose file used for testing configurations. |

## Usage Examples

```bash
# Run Postman tests without authentication
./scripts/testing/run-postman-tests-with-no-auth.sh

# Test authentication paths
./scripts/testing/test-auth-paths.sh
```

For general script documentation, see the main [README.md](../README.md).
