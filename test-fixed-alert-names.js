// Test updated Arabic alert names

const carMakes = [
  { id: 1, name: 'Toyota', slug: 'toyota', displayNameEn: 'Toyota', displayNameAr: 'تويوتا', isActive: true },
  { id: 2, name: 'Honda', slug: 'honda', displayNameEn: 'Honda', displayNameAr: 'هوندا', isActive: true },
];

const allModels = [
  { id: 1, name: 'Camry', slug: 'camry', displayNameEn: 'Camry', displayNameAr: 'كامري', isActive: true, brandId: 1 },
  { id: 2, name: 'Civic', slug: 'civic', displayNameEn: 'Civic', displayNameAr: 'سيفيك', isActive: true, brandId: 2 },
  { id: 3, name: 'Accord', slug: 'accord', displayNameEn: 'Accord', displayNameAr: 'أكورد', isActive: true, brandId: 2 },
];

function extractModelName(modelSlug, brandSlug) {
  if (!modelSlug) return modelSlug;
  
  if (brandSlug && modelSlug.toLowerCase().startsWith(brandSlug.toLowerCase() + '-')) {
    const modelPart = modelSlug.substring(brandSlug.length + 1);
    return modelPart.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
  
  const knownBrands = ['toyota', 'honda', 'bmw'];
  for (const brand of knownBrands) {
    if (modelSlug.toLowerCase().startsWith(brand + '-')) {
      const modelPart = modelSlug.substring(brand.length + 1);
      return modelPart.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  }
  
  return modelSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function getBrandDisplayName(brandSlug, isArabic) {
  const brand = carMakes.find(b => b.slug === brandSlug);
  if (brand) {
    return isArabic ? brand.displayNameAr : brand.displayNameEn;
  }
  return brandSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function getModelDisplayName(modelSlug, isArabic) {
  // First try exact match
  let model = allModels.find(m => m.slug === modelSlug);
  
  // If not found and has dash, try extracting model part
  if (!model && modelSlug.includes('-')) {
    const knownBrands = ['toyota', 'honda', 'bmw'];
    for (const brand of knownBrands) {
      if (modelSlug.toLowerCase().startsWith(brand + '-')) {
        const modelPart = modelSlug.substring(brand.length + 1);
        model = allModels.find(m => m.slug === modelPart);
        if (model) break;
      }
    }
  }
  
  if (model) {
    return isArabic ? model.displayNameAr : model.displayNameEn;
  }
  
  return extractModelName(modelSlug);
}

function generateAlertName(filters, searchQuery) {
  const parts = [];
  const partsAr = [];

  if (searchQuery && searchQuery.trim()) {
    parts.push(`"${searchQuery.trim()}"`);
    partsAr.push(`"${searchQuery.trim()}"`);
  }

  if (filters.brands && filters.brands.length > 0) {
    if (filters.brands.length === 1) {
      const brandSlug = filters.brands[0];
      const brandNameEn = getBrandDisplayName(brandSlug, false);
      const brandNameAr = getBrandDisplayName(brandSlug, true);
      
      if (filters.models && filters.models.length > 0) {
        if (filters.models.length === 1) {
          const modelNameEn = getModelDisplayName(filters.models[0], false);
          const modelNameAr = getModelDisplayName(filters.models[0], true);
          parts.push(`${brandNameEn} ${modelNameEn}`);
          partsAr.push(`${brandNameAr} ${modelNameAr}`);
        } else {
          parts.push(`${brandNameEn} (${filters.models.length} models)`);
          partsAr.push(`${brandNameAr} (${filters.models.length} موديلات)`);
        }
      } else {
        parts.push(brandNameEn);
        partsAr.push(brandNameAr);
      }
    }
  }

  let nameEn, nameAr;

  if (parts.length === 0) {
    nameEn = 'Car Alert';
    nameAr = 'بحث سيارات';
  } else if (parts.length === 1) {
    nameEn = `${parts[0]} Alert`;
    nameAr = `${partsAr[0]}`; // Just the car details without "تنبيه"
  } else {
    nameEn = parts.join(' • ');
    nameAr = partsAr.join(' • ');
  }

  return { nameEn, nameAr };
}

// Test cases
console.log('=== BEFORE (with issues) ===');
console.log('Old style: تنبيه هوندا Accord');

console.log('\n=== AFTER (fixed) ===');

// Test Honda Accord
const filters1 = {
  brands: ['honda'],
  models: ['honda-accord']  // compound slug
};

const result1 = generateAlertName(filters1, '');
console.log('English:', result1.nameEn);
console.log('Arabic:', result1.nameAr);

console.log('\n=== Test with other models ===');

// Test Honda Civic  
const filters2 = {
  brands: ['honda'],
  models: ['civic']  // simple slug
};

const result2 = generateAlertName(filters2, '');
console.log('Honda Civic English:', result2.nameEn);
console.log('Honda Civic Arabic:', result2.nameAr);

// Test Toyota Camry
const filters3 = {
  brands: ['toyota'],
  models: ['toyota-camry']  // compound slug
};

const result3 = generateAlertName(filters3, '');
console.log('Toyota Camry English:', result3.nameEn);
console.log('Toyota Camry Arabic:', result3.nameAr);
