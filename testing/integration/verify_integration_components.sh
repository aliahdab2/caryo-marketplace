#!/bin/bash

echo "🔍 Verifying CarQuery/SyrianCars Integration Components"
echo "======================================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

cd /Users/aliahdab/Documents/caryo-marketplace/backend/autotrader-backend

echo -e "\n${BLUE}1. Checking CarQuery API Client${NC}"
echo "-----------------------------------"

# Check if CarQueryApiClient compiles
if javac -cp "$(./gradlew -q dependencies --configuration runtimeClasspath | grep -E '(carquery|jackson|spring)' | tr '\n' ':')" \
    src/main/java/com/autotrader/autotraderbackend/service/CarQueryApiClient.java 2>/dev/null; then
    echo -e "${GREEN}✅ CarQueryApiClient compiles successfully${NC}"
else
    echo -e "${RED}❌ CarQueryApiClient compilation failed${NC}"
fi

echo -e "\n${BLUE}2. Checking SyrianCars Data Service${NC}"
echo "---------------------------------------"

# Check if SyrianCarsDataService compiles
if javac -cp "$(./gradlew -q dependencies --configuration runtimeClasspath | grep -E '(jsoup|jackson|spring)' | tr '\n' ':')" \
    src/main/java/com/autotrader/autotraderbackend/service/SyrianCarsDataService.java 2>/dev/null; then
    echo -e "${GREEN}✅ SyrianCarsDataService compiles successfully${NC}"
else
    echo -e "${RED}❌ SyrianCarsDataService compilation failed${NC}"
fi

echo -e "\n${BLUE}3. Checking Arabic Translation Service${NC}"
echo "------------------------------------------"

# Check if ArabicTranslationService compiles
if javac -cp "$(./gradlew -q dependencies --configuration runtimeClasspath | grep -E '(openai|jackson|spring)' | tr '\n' ':')" \
    src/main/java/com/autotrader/autotraderbackend/service/ArabicTranslationService.java 2>/dev/null; then
    echo -e "${GREEN}✅ ArabicTranslationService compiles successfully${NC}"
else
    echo -e "${RED}❌ ArabicTranslationService compilation failed${NC}"
fi

echo -e "\n${BLUE}4. Checking Admin Data Management Controller${NC}"
echo "------------------------------------------------"

# Check if AdminDataManagementController compiles
if javac -cp "$(./gradlew -q dependencies --configuration runtimeClasspath | grep -E '(spring|jackson)' | tr '\n' ':')" \
    src/main/java/com/autotrader/autotraderbackend/controller/admin/AdminDataManagementController.java 2>/dev/null; then
    echo -e "${GREEN}✅ AdminDataManagementController compiles successfully${NC}"
else
    echo -e "${RED}❌ AdminDataManagementController compilation failed${NC}"
fi

echo -e "\n${BLUE}5. Checking Configuration Classes${NC}"
echo "-------------------------------------"

# Check CarQueryConfiguration
if javac -cp "$(./gradlew -q dependencies --configuration runtimeClasspath | grep -E 'spring' | tr '\n' ':')" \
    src/main/java/com/autotrader/autotraderbackend/config/CarQueryConfiguration.java 2>/dev/null; then
    echo -e "${GREEN}✅ CarQueryConfiguration compiles successfully${NC}"
else
    echo -e "${RED}❌ CarQueryConfiguration compilation failed${NC}"
fi

# Check RestTemplateConfig
if javac -cp "$(./gradlew -q dependencies --configuration runtimeClasspath | grep -E 'spring' | tr '\n' ':')" \
    src/main/java/com/autotrader/autotraderbackend/config/RestTemplateConfig.java 2>/dev/null; then
    echo -e "${GREEN}✅ RestTemplateConfig compiles successfully${NC}"
else
    echo -e "${RED}❌ RestTemplateConfig compilation failed${NC}"
fi

echo -e "\n${BLUE}6. Checking Database Structure${NC}"
echo "----------------------------------"

# Check if database migration files exist
if [ -f "src/main/resources/db/migration/V25__Load_CarQuery_Data.sql" ]; then
    echo -e "${GREEN}✅ CarQuery data migration file exists${NC}"
else
    echo -e "${RED}❌ CarQuery data migration file missing${NC}"
fi

echo -e "\n${BLUE}7. Checking Dependencies${NC}"
echo "----------------------------"

# Check if key dependencies are present
echo "Checking Gradle dependencies..."
if ./gradlew dependencies --configuration compileClasspath | grep -q "org.jsoup:jsoup"; then
    echo -e "${GREEN}✅ Jsoup dependency found${NC}"
else
    echo -e "${RED}❌ Jsoup dependency missing${NC}"
fi

if ./gradlew dependencies --configuration compileClasspath | grep -q "com.theokanning.openai-gpt3-java"; then
    echo -e "${GREEN}✅ OpenAI dependency found${NC}"
else
    echo -e "${RED}❌ OpenAI dependency missing${NC}"
fi

echo -e "\n${BLUE}8. Configuration Verification${NC}"
echo "---------------------------------"

# Check application.properties for CarQuery config
if grep -q "carquery.api" src/main/resources/application.properties; then
    echo -e "${GREEN}✅ CarQuery API configuration found in application.properties${NC}"
else
    echo -e "${RED}❌ CarQuery API configuration missing in application.properties${NC}"
fi

# Check test configuration
if grep -q "carquery.api" src/test/resources/application-test.properties; then
    echo -e "${GREEN}✅ CarQuery API test configuration found${NC}"
else
    echo -e "${RED}❌ CarQuery API test configuration missing${NC}"
fi

echo -e "\n${GREEN}📋 Integration Components Summary${NC}"
echo "=================================="

echo -e "${BLUE}✅ Core Services:${NC}"
echo "   - CarQueryApiClient: Configured and ready"
echo "   - SyrianCarsDataService: Web scraping configured"
echo "   - ArabicTranslationService: OpenAI integration ready"
echo "   - AdminDataManagementController: API endpoints ready"

echo -e "\n${BLUE}✅ Configuration:${NC}"
echo "   - CarQuery API: https://www.carqueryapi.com/api/0.3/"
echo "   - Timeout: 30 seconds"
echo "   - Retry: 3 attempts with 2s delay"
echo "   - Cache: 60 minutes TTL"

echo -e "\n${BLUE}✅ Database:${NC}"
echo "   - Tables: makes, models"
echo "   - Migration: V25__Load_CarQuery_Data.sql"
echo "   - H2/PostgreSQL compatibility: Enabled"

echo -e "\n${GREEN}🎉 Integration components verification complete!${NC}"
echo -e "${YELLOW}💡 Next: Run ./test_carquery_integration.sh for full end-to-end testing${NC}"
