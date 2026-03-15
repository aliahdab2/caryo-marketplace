# 🧪 Integration Testing Scripts

This directory contains all integration testing scripts for the CarQuery/SyrianCars data integration system.

## 📁 **Available Scripts**

### **🔄 End-to-End Testing**
- **`test_carquery_integration.sh`** - Complete integration workflow testing
  - Starts Spring Boot application with integration profile
  - Tests admin data import endpoints
  - Verifies CarQuery and SyrianCars data loading

### **🧩 Unit Testing**
- **`test_carquery_unit_test.sh`** - Focused unit tests
  - Tests individual integration components
  - Runs specific test classes for integration services

### **🔍 Component Verification**
- **`verify_integration_components.sh`** - Component health checks
  - Verifies compilation of integration services
  - Checks configuration and dependencies

### **🎯 Manual Testing**
- **`test_manual_integration.sh`** - Manual integration testing
  - Interactive testing with real API calls
  - Manual verification of data quality

### **🌐 API Endpoint Testing**
- **`test_car_data_endpoints.sh`** - API endpoint verification
  - Tests admin CRUD endpoints
  - Verifies data import/export functionality

## 🚀 **Quick Start**

### **Run All Integration Tests**
```bash
cd /path/to/caryo-marketplace/testing/integration
./test_carquery_integration.sh
```

### **Run Component Verification**
```bash
./verify_integration_components.sh
```

### **Run Unit Tests Only**
```bash
./test_carquery_unit_test.sh
```

## ⚙️ **Prerequisites**

1. **Java 17+** installed
2. **PostgreSQL** running (for integration tests)
3. **Environment variables** configured:
   ```bash
   export CARQUERY_ENABLED=true
   export OPENAI_API_KEY=your-key-here  # Optional
   ```

## 📊 **Test Profiles**

| Profile | Database | External APIs | Purpose |
|---------|----------|---------------|---------|
| `test` | H2 (in-memory) | Disabled | Unit tests |
| `integration` | H2 (in-memory) | Enabled | Integration tests |
| `dev` | PostgreSQL | Enabled | Development |

## 🎯 **Expected Results**

### **Successful Integration Test Output:**
```
✅ CarQuery API connectivity test: SUCCESS
✅ SyrianCars data service: READY  
✅ Arabic translation service is properly configured
✅ All integration services are properly configured and injectable

Test Summary: 5 tests, 5 passed, 0 failed, 0 skipped
```

### **Common Issues & Solutions:**

**Issue:** `CarQuery API connectivity test: FAILED`
**Solution:** Check internet connection or set `CARQUERY_ENABLED=false` for offline testing

**Issue:** `OpenAI translation failed`
**Solution:** Verify `OPENAI_API_KEY` or use fallback translations

**Issue:** `Database connection failed`
**Solution:** Ensure PostgreSQL is running or use H2 profile

## 🔧 **Troubleshooting**

### **Debug Mode**
Add `--debug` flag to any script for verbose output:
```bash
./test_carquery_integration.sh --debug
```

### **Logs Location**
- Application logs: `backend/caryo-backend/logs/`
- Test logs: Console output and Gradle test reports

### **Manual Verification**
If automated tests fail, you can manually verify:
1. Start the application: `./backend/caryo-backend/gradlew bootRun`
2. Test endpoints: `curl http://localhost:8080/api/admin/data/carquery/load`
3. Check database: Connect to PostgreSQL and verify `makes`/`models` tables

---

**For detailed integration documentation, see:** [`../../docs/integration/`](../../docs/integration/)
