#!/usr/bin/env node

// Ensure proper UTF-8 encoding for Arabic text
process.stdout.setEncoding('utf8');
process.stderr.setEncoding('utf8');

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

class AutomatedTranslator {
  constructor() {
    this.translationService = new TranslationService();
    this.githubService = new GitHubService();
    this.validator = validator;
  }

  /**
   * Main workflow execution
   * @param {Object} options - Configuration options
   */
  async run(options = {}) {
    console.log('Starting AI translation process...');

    try {
      // Step 1: Validate configuration
      await this.validateConfiguration(options);

      // Step 2: Load and validate current translations
      console.log('Analyzing current translations...');
      const translations = this.validator.loadAllTranslations();
      const missingKeys = this.validator.findMissingTranslations(translations);

      // Step 3: Prepare translations for AI processing
      console.log('Preparing translations for processing...');
      const translationTasks = this.prepareTranslationTasks(translations, missingKeys, options);

      if (translationTasks.length === 0) {
        console.log('No missing translations found.');
        return;
      }

      // Step 4: Estimate costs
      const costEstimate = this.translationService.estimateCost(translationTasks);
      console.log(`Estimated cost: $${costEstimate.estimatedCostUSD} (${costEstimate.itemCount} translations)`);

      if (!options.skipConfirmation) {
        const confirmed = await this.confirmExecution(costEstimate);
        if (!confirmed) {
          console.log('Translation cancelled by user.');
          return;
        }
      }

      // Step 5: Execute AI translations
      console.log('Executing translations...');
      const translationResults = await this.translationService.translateBatch(
        translationTasks,
        options.fromLang,
        options.toLang
      );

      // Step 6: Update translation files
      console.log('Updating translation files...');
      const updatedTranslations = this.applyTranslationResults(translations, translationResults, options);

      // Step 7: Save updated translations
      console.log('Saving translation files...');
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
    console.log('Validating configuration...');

    // Check OpenAI API key
    if (!this.translationService.isConfigured()) {
      throw new Error(
        'OpenAI API key not configured. Set OPENAI_API_KEY environment variable.\n' +
        'Get your API key from: https://platform.openai.com/api-keys'
      );
    }

    // Check GitHub configuration if PR creation is enabled
    if (options.createPR) {
      if (!process.env.GITHUB_TOKEN) {
        throw new Error(
          'GitHub token not configured for PR creation. Set GITHUB_TOKEN environment variable.\n' +
          'Create a token at: https://github.com/settings/tokens'
        );
      }

      if (!options.githubOwner || !options.githubRepo) {
        throw new Error(
          'GitHub repository information required for PR creation.\n' +
          'Provide --github-owner and --github-repo options.'
        );
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
    const updated = { ...translations };
    const targetLang = options.toLang;

    results.forEach(result => {
      if (result.success && result.translated !== result.original) {
        const [namespace, key] = result.key.split('.');

        if (!updated[targetLang][namespace]) {
          updated[targetLang][namespace] = {};
        }

        updated[targetLang][namespace][key] = result.translated;

        // Display translation with clear text labels
        const originalText = result.original || 'N/A';
        const translatedText = result.translated || 'N/A';

        console.log(`  ${namespace}.${key}:`);
        console.log(`    FROM: ${originalText}`);
        console.log(`    TO:   ${translatedText}`);
        console.log(`    ----`);
        console.log();
      }
    });

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
            console.log(`💾 Saved: ${lang}/${namespace}.json`);
          } catch (error) {
            console.error(`❌ Failed to save ${lang}/${namespace}.json: ${error.message}`);
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

    console.log('\n--- Translation Summary ---');
    console.log(`Language: ${options.fromLang} → ${options.toLang}`);
    console.log(`Total: ${results.length} translations`);
    console.log(`Successful: ${successCount}`);
    if (errorCount > 0) {
      console.log(`Failed: ${errorCount}`);
    }
    console.log(`Cost: $${costEstimate.estimatedCostUSD}`);
    console.log('Translation process completed.');
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
