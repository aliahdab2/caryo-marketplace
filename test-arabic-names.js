// Test Arabic brand/model names

const carMakes = [
  { id: 1, name: 'Toyota', slug: 'toyota', displayNameEn: 'Toyota', displayNameAr: 'تويوتا', isActive: true },
  { id: 2, name: 'Honda', slug: 'honda', displayNameEn: 'Honda', displayNameAr: 'هوندا', isActive: true },
  { id: 3, name: 'BMW', slug: 'bmw', displayNameEn: 'BMW', displayNameAr: 'بي إم دبليو', isActive: true }
];

const allModels = [
  { id: 1, name: 'Camry', slug: 'toyota-camry', displayNameEn: 'Camry', displayNameAr: 'كامري', isActive: true, brandId: 1 },
  { id: 2, name: 'Civic', slug: 'honda-civic', displayNameEn: 'Civic', displayNameAr: 'سيفيك', isActive: true, brandId: 2 },
  { id: 3, name: 'X3', slug: 'bmw-x3', displayNameEn: 'X3', displayNameAr: 'إكس 3', isActive: true, brandId: 3 }
];

function getBrandDisplayName(brandSlug, isArabic) {
  const brand = carMakes.find(b => b.slug === brandSlug);
  if (brand) {
    return isArabic ? brand.displayNameAr : brand.displayNameEn;
  }
  return brandSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function getModelDisplayName(modelSlug, isArabic) {
  const model = allModels.find(m => m.slug === modelSlug);
  if (model) {
    return isArabic ? model.displayNameAr : model.displayNameEn;
  }
  return modelSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// Test cases
console.log('=== English Names ===');
console.log('Toyota brand:', getBrandDisplayName('toyota', false));
console.log('Honda brand:', getBrandDisplayName('honda', false));
console.log('Toyota Camry:', getBrandDisplayName('toyota', false), getModelDisplayName('toyota-camry', false));
console.log('Honda Civic:', getBrandDisplayName('honda', false), getModelDisplayName('honda-civic', false));

console.log('\n=== Arabic Names ===');
console.log('Toyota brand:', getBrandDisplayName('toyota', true));
console.log('Honda brand:', getBrandDisplayName('honda', true));
console.log('Toyota Camry:', getBrandDisplayName('toyota', true), getModelDisplayName('toyota-camry', true));
console.log('Honda Civic:', getBrandDisplayName('honda', true), getModelDisplayName('honda-civic', true));

console.log('\n=== Alert Name Examples ===');
const brandEn = getBrandDisplayName('honda', false);
const brandAr = getBrandDisplayName('honda', true);
const modelEn = getModelDisplayName('honda-civic', false);
const modelAr = getModelDisplayName('honda-civic', true);

console.log('English Alert:', `${brandEn} ${modelEn} • بنزين • من $3,200`);
console.log('Arabic Alert:', `${brandAr} ${modelAr} • بنزين • من $3,200`);
