/**
 * Translation Performance Module
 * Performance monitoring and optimization utilities
 */

const fs = require('fs');
const path = require('path');
const { formatFileSize, getFileStats } = require('./utils');
const { LOCALES_DIR, LANGUAGES, NAMESPACES } = require('./loader');

/**
 * Analyze translation file sizes and performance metrics
 */
function analyzeFileSizes() {
  console.log('📊 Analyzing translation file sizes...');

  const results = {
    totalFiles: 0,
    totalSize: 0,
    averageSize: 0,
    largestFile: { path: '', size: 0 },
    smallestFile: { path: '', size: Infinity },
    filesBySize: [],
    languages: {},
    namespaces: {}
  };

  LANGUAGES.forEach(language => {
    results.languages[language] = { totalSize: 0, fileCount: 0, files: [] };

    NAMESPACES.forEach(namespace => {
      const filePath = path.join(LOCALES_DIR, language, `${namespace}.json`);

      try {
        const stats = fs.statSync(filePath);
        const size = stats.size;

        // Update totals
        results.totalFiles++;
        results.totalSize += size;
        results.languages[language].totalSize += size;
        results.languages[language].fileCount++;
        results.languages[language].files.push({ namespace, size });

        // Track largest/smallest
        if (size > results.largestFile.size) {
          results.largestFile = { path: `${language}/${namespace}.json`, size };
        }
        if (size < results.smallestFile.size) {
          results.smallestFile = { path: `${language}/${namespace}.json`, size };
        }

        // Track by namespace
        if (!results.namespaces[namespace]) {
          results.namespaces[namespace] = { totalSize: 0, fileCount: 0 };
        }
        results.namespaces[namespace].totalSize += size;
        results.namespaces[namespace].fileCount++;

        results.filesBySize.push({
          path: `${language}/${namespace}.json`,
          size,
          language,
          namespace
        });

      } catch (error) {
        console.warn(`⚠️ Could not analyze ${language}/${namespace}.json: ${error.message}`);
      }
    });
  });

  // Calculate averages
  if (results.totalFiles > 0) {
    results.averageSize = results.totalSize / results.totalFiles;
  }

  // Sort files by size
  results.filesBySize.sort((a, b) => b.size - a.size);

  return results;
}

/**
 * Generate performance recommendations
 */
function generatePerformanceRecommendations(analysis) {
  const recommendations = [];

  // Check for unusually large files
  const largeFiles = analysis.filesBySize.filter(f => f.size > 100 * 1024); // > 100KB
  if (largeFiles.length > 0) {
    recommendations.push({
      type: 'warning',
      priority: 'high',
      title: 'Large Translation Files Detected',
      description: `${largeFiles.length} files exceed 100KB`,
      files: largeFiles.map(f => f.path),
      suggestion: 'Consider splitting large namespaces or optimizing key structures'
    });
  }

  // Check for size imbalances between languages
  const languageSizes = Object.entries(analysis.languages).map(([lang, data]) => ({
    language: lang,
    avgSize: data.totalSize / data.fileCount
  }));

  const maxAvg = Math.max(...languageSizes.map(l => l.avgSize));
  const minAvg = Math.min(...languageSizes.map(l => l.avgSize));
  const ratio = maxAvg / minAvg;

  if (ratio > 2) {
    recommendations.push({
      type: 'info',
      priority: 'medium',
      title: 'Language Size Imbalance',
      description: `Largest language is ${ratio.toFixed(1)}x larger than smallest`,
      suggestion: 'Check for missing translations or unusually long text in some languages'
    });
  }

  // Check for empty or very small files
  const smallFiles = analysis.filesBySize.filter(f => f.size < 100); // < 100 bytes
  if (smallFiles.length > 0) {
    recommendations.push({
      type: 'warning',
      priority: 'medium',
      title: 'Potentially Empty Files',
      description: `${smallFiles.length} files are unusually small (< 100 bytes)`,
      files: smallFiles.map(f => f.path),
      suggestion: 'Verify these files contain expected translations'
    });
  }

  return recommendations;
}

/**
 * Display performance analysis
 */
function displayPerformanceAnalysis(analysis, recommendations = []) {
  console.log('\n📊 TRANSLATION PERFORMANCE ANALYSIS');
  console.log('=====================================');

  console.log(`\n📁 File Statistics:`);
  console.log(`   Total files: ${analysis.totalFiles}`);
  console.log(`   Total size: ${formatFileSize(analysis.totalSize)}`);
  console.log(`   Average size: ${formatFileSize(analysis.averageSize)}`);

  console.log(`\n📏 Size Range:`);
  console.log(`   Largest: ${analysis.largestFile.path} (${formatFileSize(analysis.largestFile.size)})`);
  console.log(`   Smallest: ${analysis.smallestFile.path} (${formatFileSize(analysis.smallestFile.size)})`);

  console.log(`\n🌍 Language Breakdown:`);
  Object.entries(analysis.languages).forEach(([lang, data]) => {
    const avgSize = data.totalSize / data.fileCount;
    console.log(`   ${lang}: ${data.fileCount} files, ${formatFileSize(data.totalSize)} total, ${formatFileSize(avgSize)} avg`);
  });

  console.log(`\n📂 Namespace Breakdown:`);
  Object.entries(analysis.namespaces).forEach(([ns, data]) => {
    const avgSize = data.totalSize / data.fileCount;
    console.log(`   ${ns}: ${data.fileCount} files, ${formatFileSize(data.totalSize)} total, ${formatFileSize(avgSize)} avg`);
  });

  if (recommendations.length > 0) {
    console.log(`\n💡 RECOMMENDATIONS:`);
    recommendations.forEach((rec, index) => {
      const icon = rec.type === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`   ${index + 1}. ${icon} ${rec.title}`);
      console.log(`      ${rec.description}`);
      console.log(`      💡 ${rec.suggestion}`);
      if (rec.files && rec.files.length > 0) {
        console.log(`      📁 Files: ${rec.files.slice(0, 3).join(', ')}${rec.files.length > 3 ? ` (+${rec.files.length - 3} more)` : ''}`);
      }
      console.log('');
    });
  }
}

module.exports = {
  analyzeFileSizes,
  generatePerformanceRecommendations,
  displayPerformanceAnalysis
};
