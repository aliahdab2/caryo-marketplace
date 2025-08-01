# Enhanced SEO URL System - Test Cases

Your SearchRedirector now supports advanced URL patterns with best practices for car marketplace SEO.

## Supported URL Patterns

### 1. Basic Pattern (Current System)
- `/cars/toyota-camry/damascus` → `brand=toyota&model=toyota-camry&locations=damascus`
- `/cars/bmw-x3/aleppo` → `brand=bmw&model=bmw-x3&locations=aleppo`

### 2. Year Filtering (NEW)
- `/cars/2024/toyota-camry/damascus` → `years=2024&brand=toyota&model=toyota-camry&locations=damascus`
- `/cars/2023/bmw-x3/aleppo` → `years=2023&brand=bmw&model=bmw-x3&locations=aleppo`

### 3. Condition Filtering (NEW)
- `/cars/new/toyota-camry/damascus` → `condition=new&brand=toyota&model=toyota-camry&locations=damascus`
- `/cars/used/bmw-x3/aleppo` → `condition=used&brand=bmw&model=bmw-x3&locations=aleppo`
- `/cars/certified/honda-civic/homs` → `condition=certified&brand=honda&model=honda-civic&locations=homs`

### 4. Combined Year + Condition (NEW)
- `/cars/2024/new/toyota-camry/damascus` → `years=2024&condition=new&brand=toyota&model=toyota-camry&locations=damascus`
- `/cars/2023/used/bmw-x3/aleppo` → `years=2023&condition=used&brand=bmw&model=bmw-x3&locations=aleppo`

### 5. Price Filtering (NEW)
- `/cars/toyota-camry/under-50k/damascus` → `brand=toyota&model=toyota-camry&maxPrice=50000&locations=damascus`
- `/cars/bmw-x3/over-100k/aleppo` → `brand=bmw&model=bmw-x3&minPrice=100000&locations=aleppo`
- `/cars/honda-civic/50k-to-100k/homs` → `brand=honda&model=honda-civic&minPrice=50000&maxPrice=100000&locations=homs`

### 6. Full Pattern (NEW)
- `/cars/2024/used/toyota-camry/under-80k/damascus` → `years=2024&condition=used&brand=toyota&model=toyota-camry&maxPrice=80000&locations=damascus`

### 7. Multiple Models (Current System)
- `/cars/toyota-camry/honda-civic/damascus` → `brand=toyota&brand=honda&model=toyota-camry&model=honda-civic&locations=damascus`

### 8. Multiple Locations (Current System)
- `/cars/toyota-camry/damascus-aleppo` → `brand=toyota&model=toyota-camry&locations=damascus-aleppo`

## SEO Benefits

### 1. **Year-based URLs**
- Great for targeting specific model years
- Helps with seasonal car shopping patterns
- Examples: "2024 Toyota Camry Damascus", "2023 Used BMW X3 Aleppo"

### 2. **Condition-based URLs**
- Clear intent signaling for search engines
- Better user experience with direct filtering
- Examples: "New Toyota Camry Damascus", "Used Cars Aleppo"

### 3. **Price-filtered URLs**
- Targets budget-conscious shoppers
- Helps with price-based search queries
- Examples: "Cars Under 50k Damascus", "Luxury Cars Over 100k"

### 4. **Combined Filtering**
- Maximum specificity for search engines
- Long-tail keyword targeting
- Examples: "2024 New Toyota Camry Under 80k Damascus"

## Technical Implementation

### Order Hierarchy (Important!)
1. **Year** (optional, must be first): `1990-2025`
2. **Condition** (optional): `new`, `used`, `certified`
3. **Brand/Model** segments: `toyota-camry`, `bmw-x3`
4. **Price filter** (optional): `under-50k`, `over-100k`, `50k-to-100k`
5. **Location** segments: `damascus`, `aleppo`

### Validation Rules
- Years: 1990 to current year + 1
- Conditions: `new`, `used`, `certified` only
- Price format: `under-[amount]`, `over-[amount]`, `[min]-to-[max]`
- All amounts automatically converted to thousands (50k = 50,000)

## Testing Your URLs

You can test these URLs by navigating to them in your browser. They will automatically redirect to the search page with the appropriate filters applied.

### Quick Test Examples
1. Visit: `http://localhost:3000/cars/2024/toyota-camry/damascus`
2. Visit: `http://localhost:3000/cars/new/honda-civic/aleppo`
3. Visit: `http://localhost:3000/cars/used/bmw-x3/under-100k/homs`

All URLs will redirect to `/search` with the appropriate query parameters applied!
