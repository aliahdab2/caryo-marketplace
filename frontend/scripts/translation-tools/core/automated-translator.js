#!/usr/bin/env node

// Ensure proper UTF-8 encoding for Arabic text
process.stdout.setEncoding('utf8');
process.stderr.setEncoding('utf8');

// Set terminal to handle Unicode properly
if (process.platform === 'win32') {
  // Windows specific setup
  try {
    require('child_process').execSync('chcp 65001', { stdio: 'inherit' });
  } catch (e) {
    // Ignore if chcp fails
  }
} else {
  // Unix/Linux/Mac setup
  process.env.LANG = process.env.LANG || 'en_US.UTF-8';
  process.env.LC_ALL = process.env.LC_ALL || 'en_US.UTF-8';
}

/**
 * Automated AI Translation Workflow
 * - Validates translations
 * - Uses AI to translate missing keys
 * - Creates GitHub PR automatically
 */

const fs = require('fs');
const path = require('path');
const TranslationService = require('./translation-service');
const GitHubService = require('./github-service');

// Import validator functions
const validatorPath = path.join(__dirname, 'validator.js');
const validator = require(validatorPath);

/**
 * Key mapping between source code usage and translation file structure
 * Source code uses: "namespace.key" (e.g., "listings.removeFromFavorites")
 * Translation files use: "namespace": "value" or nested objects
 */
const KEY_MAPPING = {
  // Common namespace mappings
  'common.listings.removeFromFavorites': 'listings.removeFromFavorites',
  'common.listings.addToFavorites': 'listings.addToFavorites',
  'common.listings.expiresIn': 'listings.expiresIn',
  'common.settings.savedSuccessfully': 'settings',
  'common.settings.accountPreferences': 'settings',
  'common.settings.language': 'settings',
  'common.settings.notificationSettings': 'settings',
  'common.settings.emailNotifications': 'settings',
  'common.settings.emailNotificationsDesc': 'settings',

  // Listings namespace mappings
  'listings.filters.sellerType': 'filters',
  'listings.filters.noSellerTypes': 'filters',
};

class AutomatedTranslator {
  constructor() {
    this.translationService = new TranslationService();
    this.githubService = new GitHubService();
    this.validator = validator;
  }

  /**
   * Resolve source code key to translation file key
   * @param {string} sourceKey - Key from source code (e.g., "common.listings.removeFromFavorites")
   * @returns {object} - { namespace, key, fullPath }
   */
  resolveKey(sourceKey) {
    const mappedKey = KEY_MAPPING[sourceKey] || sourceKey;
    const parts = mappedKey.split('.');

    return {
      namespace: parts[0],
      key: parts.slice(1).join('.'),
      fullPath: mappedKey,
      sourceKey: sourceKey
    };
  }

  /**
   * Main workflow execution
   * @param {Object} options - Configuration options
   */
  async run(options = {}) {
    console.log(`Translation: ${options.fromLang} → ${options.toLang}`);

    try {
      // Validate and prepare
      await this.validateConfiguration(options);
      const translations = this.validator.loadAllTranslations();
      const missingKeys = this.validator.findMissingTranslations(translations);
      const translationTasks = this.prepareTranslationTasks(translations, missingKeys, options);

      if (translationTasks.length === 0) {
        console.log('No missing translations found.');
        return;
      }

      // Cost estimation and confirmation
      const costEstimate = this.translationService.estimateCost(translationTasks);
      console.log(`Found: ${translationTasks.length} missing translations`);
      console.log(`Cost: $${costEstimate.estimatedCostUSD}`);

      if (!options.skipConfirmation) {
        const confirmed = await this.confirmExecution(costEstimate);
        if (!confirmed) {
          console.log('Cancelled.');
          return;
        }
      }

      // Execute translations
      console.log('Processing...');
      const translationResults = await this.translationService.translateBatch(
        translationTasks,
        options.fromLang,
        options.toLang
      );

      // Apply and save results
      const updatedTranslations = this.applyTranslationResults(translations, translationResults, options);
      this.saveUpdatedTranslations(updatedTranslations);

      // Step 8: Create GitHub PR
      if (options.createPR) {
        console.log('Creating GitHub PR...');
        await this.createGitHubPR(updatedTranslations, translationResults, costEstimate, options);
      }

      // Step 9: Generate summary
      this.generateSummary(translationResults, costEstimate, options);

    } catch (error) {
      console.error('Translation process failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Validate configuration and API keys
   */
  async validateConfiguration(options) {
    // Check OpenAI API key
    if (!this.translationService.isConfigured()) {
      throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY environment variable.');
    }

    // Check GitHub configuration if PR creation is enabled
    if (options.createPR) {
      if (!process.env.GITHUB_TOKEN) {
        throw new Error('GitHub token not configured for PR creation.');
      }

      if (!options.githubOwner || !options.githubRepo) {
        throw new Error('GitHub repository information required for PR creation.');
      }

      this.githubService.initialize(
        process.env.GITHUB_TOKEN,
        options.githubOwner,
        options.githubRepo,
        options.githubBranch || 'main'
      );
    }

    console.log('✅ Configuration validated');
  }

  /**
   * Prepare translation tasks from missing keys
   */
  prepareTranslationTasks(translations, missingKeys, options) {
    const tasks = [];
    const targetLang = options.toLang;
    const sourceLang = options.fromLang;

    // Get missing keys for target language
    if (missingKeys[targetLang]) {
      Object.keys(missingKeys[targetLang]).forEach(namespace => {
        if (missingKeys[targetLang][namespace] && Array.isArray(missingKeys[targetLang][namespace])) {
          missingKeys[targetLang][namespace].forEach(key => {
            // Find source translation
            if (translations[sourceLang] && translations[sourceLang][namespace] && translations[sourceLang][namespace][key]) {
              const sourceText = translations[sourceLang][namespace][key];
              const context = `${namespace}.${key}`;

              // Skip if source text is already in target language (from previous bad translation)
              if (this.isAlreadyTranslated(sourceText, sourceLang, targetLang)) {
                console.log(`⏭️  Skipping "${key}" - already translated`);
                return;
              }

              tasks.push({
                key: `${namespace}.${key}`,
                text: sourceText,
                context: context,
                namespace: namespace,
                keyName: key
              });
            }
          });
        }
      });
    }

    console.log(`📋 Prepared ${tasks.length} translation tasks`);
    return tasks;
  }

  /**
   * Check if text is already in target language
   */
  isAlreadyTranslated(text, sourceLang, targetLang) {
    // Simple heuristic: check for Arabic characters if translating to Arabic
    if (targetLang === 'ar') {
      const arabicRegex = /[\u0600-\u06FF]/;
      return arabicRegex.test(text);
    }

    // Add more sophisticated checks for other languages as needed
    return false;
  }

  /**
   * Confirm execution with cost estimate
   */
  async confirmExecution(costEstimate) {
    console.log(`\nCost breakdown:`);
    console.log(`  Items: ${costEstimate.itemCount}`);
    console.log(`  Estimated cost: $${costEstimate.estimatedCostUSD}`);
    console.log(`  Cost per item: $${costEstimate.costPerItem}`);

    // In a real implementation, you'd prompt the user
    // For now, we'll assume confirmation
    console.log('Proceeding with translation...');
    return true;
  }

  /**
   * Apply translation results to translations object
   */
  applyTranslationResults(translations, results, options) {
    const updated = JSON.parse(JSON.stringify(translations)); // Deep clone
    const targetLang = options.toLang;
    let appliedCount = 0;

    results.forEach(result => {
      if (result.success && result.translated !== result.original) {
        // Use key mapping to resolve the correct file structure
        const resolved = this.resolveKey(result.key);
        const { namespace, key } = resolved;

        // Ensure namespace exists
        if (!updated[targetLang][namespace]) {
          updated[targetLang][namespace] = {};
        }

        // Apply translation to resolved key
        if (!key || key.trim() === '') {
          console.log(`  ⚠️  Skipping ${result.key}: would create empty key`);
          return;
        }

        // Check for nested structure creation (violates translation guide)
        if (key.includes('.')) {
          console.log(`  ⚠️  WARNING: ${result.key} would create nested structure (violates translation guide)`);
          console.log(`     Consider updating KEY_MAPPING to use flat keys`);
          // For now, skip nested key creation to maintain flat structure
          console.log(`     Skipping: ${result.key}`);
          return;
        }

        // Simple key only (maintains flat structure)
        updated[targetLang][namespace][key] = result.translated;

        appliedCount++;
        process.stdout.write('.');
      }
    });

    console.log(`\nApplied ${appliedCount} translations`);
    return updated;
  }

  /**
   * Save updated translations to files
   */
  saveUpdatedTranslations(translations) {
    const langs = ['en', 'ar']; // Hardcoded for now, can be made configurable later
    const baseDir = path.join(__dirname, '..', '..', '..', 'public', 'locales');

    langs.forEach(lang => {
      if (translations[lang]) {
        Object.keys(translations[lang]).forEach(namespace => {
          const filePath = path.join(baseDir, lang, `${namespace}.json`);

          try {
            // Ensure directory exists
            const dirPath = path.dirname(filePath);
            if (!fs.existsSync(dirPath)) {
              fs.mkdirSync(dirPath, { recursive: true });
            }

            const content = JSON.stringify(translations[lang][namespace], null, 2);
            fs.writeFileSync(filePath, content, 'utf8');
          } catch (error) {
            console.error(`Failed to save ${lang}/${namespace}.json: ${error.message}`);
          }
        });
      }
    });
  }

  /**
   * Create GitHub PR with translation changes
   */
  async createGitHubPR(translations, results, costEstimate, options) {
    try {
      // Create branch
      const branchName = await this.githubService.createTranslationBranch(options.githubBranch);

      // Prepare files for upload
      const translationFiles = {};
      const langs = process.env.NODE_ENV === 'test' ? this.validator.TEST_LANGUAGES : this.validator.LANGUAGES;
      const baseDir = process.env.NODE_ENV === 'test' ? this.validator.TEST_LOCALES_DIR : this.validator.LOCALES_DIR;

      langs.forEach(lang => {
        if (translations[lang]) {
          Object.keys(translations[lang]).forEach(namespace => {
            const filePath = path.join(baseDir, lang, `${namespace}.json`);
            if (fs.existsSync(filePath)) {
              const relativePath = `public/locales/${lang}/${namespace}.json`;
              translationFiles[relativePath] = fs.readFileSync(filePath, 'utf8');
            }
          });
        }
      });

      // Upload files
      const uploadedFiles = await this.githubService.uploadTranslationFiles(
        branchName,
        translationFiles,
        options.githubBranch
      );

      // Create PR
      const prTitle = `🤖 AI Translation: ${options.fromLang} → ${options.toLang} (${results.length} translations)`;

      const translationStats = {
        fromLang: options.fromLang,
        toLang: options.toLang,
        totalCount: results.length,
        successCount: results.filter(r => r.success).length,
        errorCount: results.filter(r => !r.success).length,
        estimatedCost: costEstimate.estimatedCostUSD
      };

      const prDescription = this.githubService.generatePRDescription(translationStats, uploadedFiles);

      const pr = await this.githubService.createPullRequest(
        branchName,
        prTitle,
        prDescription
      );

      console.log(`\n🎉 PR Created Successfully!`);
      console.log(`   PR: ${pr.url}`);
      console.log(`   Branch: ${pr.branch}`);

    } catch (error) {
      console.error('❌ Failed to create GitHub PR:', error.message);
      // Don't fail the entire process if PR creation fails
    }
  }

  /**
   * Generate final summary
   */
  generateSummary(results, costEstimate, options) {
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    console.log(`\nCompleted: ${successCount}/${results.length} translations`);
    if (errorCount > 0) {
      console.log(`Errors: ${errorCount}`);
    }
    console.log(`Total cost: $${costEstimate.estimatedCostUSD}`);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    fromLang: 'ar',
    toLang: 'en',
    createPR: false,
    skipConfirmation: false,
    githubOwner: null,
    githubRepo: null,
    githubBranch: 'main'
  };

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--from':
      case '-f':
        options.fromLang = args[++i];
        break;
      case '--to':
      case '-t':
        options.toLang = args[++i];
        break;
      case '--create-pr':
        options.createPR = true;
        break;
      case '--github-owner':
        options.githubOwner = args[++i];
        break;
      case '--github-repo':
        options.githubRepo = args[++i];
        break;
      case '--github-branch':
        options.githubBranch = args[++i];
        break;
      case '--yes':
        options.skipConfirmation = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Automated AI Translation Tool

Usage: node automated-translator.js [options]

Options:
  -f, --from <lang>          Source language (default: ar)
  -t, --to <lang>            Target language (default: en)
  --create-pr                Create GitHub PR automatically
  --github-owner <owner>     GitHub repository owner
  --github-repo <repo>       GitHub repository name
  --github-branch <branch>   GitHub base branch (default: main)
  --yes                      Skip confirmation prompts
  -h, --help                 Show this help

Environment Variables:
  OPENAI_API_KEY             Required for AI translation
  GITHUB_TOKEN               Required for PR creation

Examples:
  # Translate Arabic to English
  node automated-translator.js --from ar --to en

  # Translate with GitHub PR creation
  node automated-translator.js --from ar --to en --create-pr --github-owner myuser --github-repo myrepo
`);
        process.exit(0);
    }
  }

  const translator = new AutomatedTranslator();
  await translator.run(options);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = AutomatedTranslator;
