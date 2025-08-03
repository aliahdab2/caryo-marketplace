#!/usr/bin/env node

// Test to debug the model slug extraction issue

console.log('🔍 Debugging Model Slug Extraction\n');

// Simulate the actual data structure
const carMakes = [
  { id: 1, slug: 'toyota', displayNameEn: 'Toyota', displayNameAr: 'تويوتا' },
  { id: 2, slug: 'honda', displayNameEn: 'Honda', displayNameAr: 'هوندا' }
];

// This is what allModels looks like in practice (simple slugs, not compound)
const allModels = [
  { id: 1, slug: 'camry', displayNameEn: 'Camry', displayNameAr: 'كامري', brandId: 1 },
  { id: 2, slug: 'civic', displayNameEn: 'Civic', displayNameAr: 'سيفيك', brandId: 2 },
  { id: 3, slug: 'accord', displayNameEn: 'Accord', displayNameAr: 'أكورد', brandId: 2 }
];

function getModelDisplayName(modelSlug, isArabic) {
  console.log(`Trying to find model with slug: "${modelSlug}"`);
  
  // First try to find by exact slug match
  let model = allModels?.find(m => m.slug === modelSlug);
  console.log(`Direct lookup result: ${model ? model.displayNameEn : 'NOT FOUND'}`);
  
  // If not found and slug contains a dash, try to find by just the model part
  if (!model && modelSlug.includes('-') && carMakes && carMakes.length > 0) {
    console.log('Compound slug detected, extracting model part...');
    
    // Extract the model part from compound slugs like "honda-accord" -> "accord"
    for (const brand of carMakes) {
      if (modelSlug.toLowerCase().startsWith(brand.slug + '-')) {
        const modelPart = modelSlug.substring(brand.slug.length + 1);
        console.log(`  Checking brand "${brand.slug}": extracted model part = "${modelPart}"`);
        
        model = allModels?.find(m => m.slug === modelPart);
        if (model) {
          console.log(`  ✅ Found model: ${model.displayNameEn} / ${model.displayNameAr}`);
          break;
        } else {
          console.log(`  ❌ Model part "${modelPart}" not found in allModels`);
        }
      }
    }
  }
  
  if (model) {
    const result = isArabic ? model.displayNameAr : model.displayNameEn;
    console.log(`Final result: "${result}"\n`);
    return result;
  }
  
  // Fallback to extracted model name
  const fallback = modelSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  console.log(`Fallback result: "${fallback}"\n`);
  return fallback;
}

// Test cases
console.log('=== Test Cases ===\n');

console.log('1. Direct model slug:');
getModelDisplayName('camry', true);

console.log('2. Compound model slug (should work):');
getModelDisplayName('toyota-camry', true);

console.log('3. Another compound slug:');
getModelDisplayName('honda-accord', true);

console.log('4. Non-existent compound slug:');
getModelDisplayName('honda-unknown', true);

console.log('=== Available Models ===');
allModels.forEach(model => {
  console.log(`- ${model.slug} → ${model.displayNameEn} / ${model.displayNameAr}`);
});
