# 🧪 Excel Data Management Testing Guide

## Prerequisites

1. **Start the Backend Server**
   ```bash
   cd backend/autotrader-backend
   export JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-21.jdk/Contents/Home
   ./gradlew bootRun
   ```

2. **Start the Frontend Server**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Admin Access**: Ensure you have admin privileges in the system

## 🔧 **Automated Tests**

### Run Unit Tests
```bash
cd backend/autotrader-backend
export JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-21.jdk/Contents/Home
./gradlew test --tests CarDataExcelServiceTest
```

### Run Integration Tests
```bash
./gradlew test --tests CarDataExcelIntegrationTest
```

### Run API Tests
```bash
./gradlew test --tests AdminDataManagementControllerTest
```

### Run All Tests
```bash
./gradlew test
```

## 🖱️ **Manual Testing Steps**

### 1. **Access the Data Management Page**

1. Open browser: `http://localhost:3000`
2. Login as admin user
3. Navigate to Dashboard → Data Management
4. Verify the page loads with:
   - Statistics cards showing current data counts
   - Three tabs: Overview, Brands, Models
   - Export/Import buttons in header

### 2. **Test Excel Export**

1. Click **"Export Excel"** button
2. Verify:
   - ✅ File downloads automatically
   - ✅ Filename: `caryo-car-data-export-YYYY-MM-DD.xlsx`
   - ✅ Success toast message appears
   - ✅ Button shows "Exporting..." during process

3. Open the downloaded Excel file:
   - ✅ Two sheets: "Car Brands" and "Car Models"
   - ✅ Proper headers in both sheets
   - ✅ Data includes both English and Arabic names
   - ✅ All current brands and models are present

### 3. **Test Data Viewing**

1. **Brands Tab**:
   - ✅ Shows all brands with English/Arabic names
   - ✅ Displays slug and status
   - ✅ Table is sortable and searchable

2. **Models Tab**:
   - ✅ Shows all models with brand relationships
   - ✅ Displays English/Arabic names
   - ✅ Shows associated brand information

### 4. **Test Excel Import**

#### 4.1 **Valid Import Test**
1. Modify the exported Excel file:
   - Add a new brand row with valid data
   - Add a new model row with valid data
   - Modify an existing brand's Arabic name
2. Click **"Import Excel"** button
3. Select the modified file
4. Verify:
   - ✅ Success message with import summary
   - ✅ New data appears in the interface
   - ✅ Modified data is updated
   - ✅ Statistics cards update

#### 4.2 **Invalid File Test**
1. Try to upload a non-Excel file (e.g., .txt, .pdf)
2. Verify:
   - ✅ Error message: "Please select a valid Excel file"
   - ✅ No data is imported

#### 4.3 **Invalid Data Test**
1. Create Excel with invalid data:
   - Empty required fields
   - Invalid brand IDs for models
   - Duplicate slugs
2. Import the file
3. Verify:
   - ✅ Import completes with warnings
   - ✅ Error details are shown
   - ✅ Valid data is imported, invalid data is skipped

### 5. **Test Data Integrity**

1. **Before Import**: Note current statistics
2. **Import Data**: Add new brands and models
3. **Verify**:
   - ✅ Statistics update correctly
   - ✅ Brand-model relationships are maintained
   - ✅ Slugs are generated correctly
   - ✅ Arabic translations are preserved

### 6. **Test Error Handling**

1. **Network Error**: Disconnect internet during export
2. **Server Error**: Stop backend during operation
3. **Large File**: Try importing very large Excel file
4. Verify:
   - ✅ Appropriate error messages
   - ✅ UI remains responsive
   - ✅ No data corruption

## 🔍 **API Testing with Postman/curl**

### Export Excel
```bash
curl -X GET "http://localhost:8080/api/admin/data/export-excel" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -o "test-export.xlsx"
```

### Import Excel
```bash
curl -X POST "http://localhost:8080/api/admin/data/import-excel" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "file=@test-import.xlsx"
```

### Get Statistics
```bash
curl -X GET "http://localhost:8080/api/admin/data/statistics" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 📊 **Performance Testing**

### Large Dataset Test
1. Import CarQuery data: `POST /api/admin/data/load-carquery`
2. Export to Excel (should handle 100+ brands, 1000+ models)
3. Verify:
   - ✅ Export completes within reasonable time
   - ✅ Excel file opens correctly
   - ✅ All data is present and accurate

### Concurrent Access Test
1. Multiple admin users access data management simultaneously
2. One user exports while another imports
3. Verify:
   - ✅ No data corruption
   - ✅ Operations complete successfully
   - ✅ UI remains responsive

## ✅ **Test Checklist**

### Backend Tests
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] API endpoint tests pass
- [ ] Excel generation works
- [ ] Excel parsing works
- [ ] Data validation works
- [ ] Error handling works

### Frontend Tests
- [ ] Page loads correctly
- [ ] Navigation works
- [ ] Export button works
- [ ] Import button works
- [ ] File validation works
- [ ] Progress indicators work
- [ ] Error messages display
- [ ] Success messages display
- [ ] Data refreshes after import

### Integration Tests
- [ ] Full export-import cycle works
- [ ] Data integrity maintained
- [ ] Bilingual support works
- [ ] Statistics update correctly
- [ ] Admin access control works

### Edge Cases
- [ ] Empty database export
- [ ] Large file import
- [ ] Invalid file formats
- [ ] Network interruptions
- [ ] Concurrent operations
- [ ] Special characters in names
- [ ] Very long names
- [ ] Duplicate data handling

## 🐛 **Common Issues & Solutions**

### Issue: "File must be an Excel file"
**Solution**: Ensure file has .xlsx or .xls extension and correct MIME type

### Issue: Import fails silently
**Solution**: Check browser console and server logs for detailed errors

### Issue: Arabic text appears as squares
**Solution**: Ensure Excel has proper UTF-8 encoding support

### Issue: Statistics don't update
**Solution**: Refresh the page or check if backend services are running

## 📝 **Test Results Template**

```
Test Date: ___________
Tester: ___________
Environment: ___________

✅ Export Functionality: PASS/FAIL
✅ Import Functionality: PASS/FAIL
✅ Data Validation: PASS/FAIL
✅ Error Handling: PASS/FAIL
✅ UI Responsiveness: PASS/FAIL
✅ Bilingual Support: PASS/FAIL

Notes:
_________________________________
_________________________________
```

This comprehensive testing approach ensures the Excel data management system works reliably in all scenarios! 🎯
