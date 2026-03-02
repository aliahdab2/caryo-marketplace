---
name: diagnose
description: Diagnose project issues — environment, build failures, test failures, dependency problems
user-invocable: true
---

# Project Diagnostics

## Step 1: Environment Check

Run these checks to verify the development environment:

```bash
# Java (REQUIRED: 21)
java -version

# Node.js
node -v

# npm
npm -v

# Docker (needed for integration tests)
docker --version
docker compose version

# Gradle wrapper
cd backend/autotrader-backend && ./gradlew --version
```

**Java 21 is mandatory.** If wrong version:
```bash
sdk use java 21.0.8-zulu
# or
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
```

## Step 2: Identify the Problem Category

### Build Failures

**Frontend won't build:**
```bash
cd frontend && npm ci --prefer-offline --no-audit
cd frontend && npm run build 2>&1 | tail -50
```

**Backend won't build:**
```bash
cd backend/autotrader-backend && ./gradlew assemble --no-daemon --stacktrace 2>&1 | tail -50
```

### Test Failures

**Frontend tests:**
```bash
cd frontend && npm test -- --watchAll=false --verbose 2>&1 | tail -80
```

**Backend tests:**
```bash
cd backend/autotrader-backend && SPRING_PROFILES_ACTIVE=test ./gradlew test --no-daemon --info 2>&1 | tail -80
```

**Integration tests (need Docker running):**
```bash
docker ps  # verify Docker is running
make integration
```

### Translation Issues

```bash
cd frontend && npm run translation:validate
cd frontend && npm run translation:detailed  # for specifics
```

### Dependency Issues

**Frontend:**
```bash
cd frontend && npm ls --depth=0 2>&1 | grep -i err
cd frontend && npm audit --production
```

**Backend:**
```bash
cd backend/autotrader-backend && ./gradlew dependencies --configuration runtimeClasspath | head -100
```

### Docker / Services

```bash
docker ps                          # running containers
docker compose -f backend/autotrader-backend/docker-compose.dev.yml ps
make services-up                   # start services
make services-down                 # stop services
```

## Step 3: Common Issues & Fixes

| Symptom | Likely Cause | Fix |
|---|---|---|
| `Unsupported class file major version 67` | Wrong Java version | `sdk use java 21.0.8-zulu` |
| `ENOENT .next` | Missing build | `cd frontend && npm run build` |
| `Module not found` | Missing deps | `cd frontend && npm ci` |
| `Flyway migration checksum mismatch` | Edited existing migration | Revert the edit — migrations are immutable |
| `Connection refused :5432` | PostgreSQL not running | `make services-up` |
| `Testcontainers: Could not find a valid Docker` | Docker not running | Start Docker Desktop |
| `ENOMEM` or OOM | Node out of memory | `export NODE_OPTIONS="--max-old-space-size=4096"` |
| `translation:validate` fails | Missing/extra keys | Run `npm run translation:detailed` for specifics |

## Output Format

Report findings as:
```
## Diagnosis

### Environment: OK / ISSUE
- Java: [version] (expected 21)
- Node: [version]
- Docker: running / not running

### Problem Found
[Description of the root cause]

### Fix
[Step-by-step resolution]
```
