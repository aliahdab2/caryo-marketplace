# 🤖 AI Translation Automation

This system provides automated translation management with AI-powered translation and GitHub PR creation.

## 🚀 Features

- ✅ **AI-Powered Translation** using OpenAI GPT-4
- ✅ **Smart Cost Estimation** before translation
- ✅ **Automatic PR Creation** with detailed descriptions
- ✅ **Quality Control** with manual review options
- ✅ **Batch Processing** for efficient translation
- ✅ **Multi-language Support** (Arabic, English, and more)
- ✅ **Enhanced Fallback Detection** - Intelligent classification of missing translations
- ✅ **Priority-Based Validation** - Critical vs Warning missing keys
- ✅ **Context-Aware Analysis** - Source code scanning with fallback detection
- ✅ **Translation Guide Validation** - Automated checking of naming conventions

## 🧠 Enhanced Fallback Detection

The translation validator now intelligently classifies missing translations based on their impact:

### 🔴 Critical Issues
```javascript
// App will break - shows raw key names
t('missing.key')  // ❌ No fallback provided
```

### 🟡 Warning Issues
```javascript
// App works but not internationalized
showError(t('admin.bulkActionError', 'Bulk action failed'))  // ✅ Has fallback
```

### 📊 Smart Export Classification
```bash
npm run translation:export-missing en
```

**Output Example:**
```
🔴 CRITICAL ISSUES: 3 keys without fallbacks
🟡 WARNING ISSUES: 280 keys with fallbacks

💡 PRIORITY ORDER:
1. 🔴 Critical keys (no fallback) - App may show raw key names
2. 🟡 Warning keys (has fallback) - App works but not internationalized
3. ✅ Normal missing - Source exists, just needs translation
```

### 🎯 Benefits
- **Faster Debugging** - Focus on critical issues first
- **Better UX** - Apps with fallbacks continue working
- **Smarter Workflow** - Prioritize based on impact
- **Enhanced AI Translation** - Different strategies for different priorities

## 🔍 Translation Guide Validation

The validator now includes automated checking of translation keys against naming conventions and best practices:

```bash
# Validate all translation keys against naming conventions
npm run translation:validate
```

### 📋 Validation Rules
- ✅ **Flat Structure**: Detects nested objects (should use flat keys)
- ✅ **Invalid Characters**: Flags keys with special characters
- ✅ **Consistent Separators**: Ensures consistent use of dots vs underscores
- ✅ **Case Consistency**: Validates camelCase vs kebab-case patterns
- ✅ **Key Length**: Prevents overly long or short keys
- ✅ **Reserved Words**: Avoids programming language reserved words
- ✅ **Namespace Patterns**: Ensures proper namespace prefixes

### 📊 Sample Output
```
🔍 Validating translation keys against naming conventions...
⚠️  Found 366 translation guide violations:

🔧 NESTED OBJECTS (33):
❌ en/common: ageRestriction.contactSupport
   Issue: Translation files should use flat keys, not nested objects
   Suggestion: Flatten nested objects using dot notation

🔧 INVALID PATTERNS (16):
❌ en/common: @title.description
   Issue: Key contains invalid characters: @title.description
   Suggestion: Use only letters, numbers, dots, underscores, hyphens

🔧 NAMESPACE ISSUES (299):
❌ en/dashboard: admin.title
   Issue: Key doesn't follow namespace pattern: dashboard
   Suggestion: Use namespace prefix: dashboard.title
```

### 🎯 Benefits
- **Quality Assurance** - Automated checking of translation standards
- **Consistency** - Ensures uniform naming across all languages
- **Maintainability** - Prevents problematic key patterns
- **Early Detection** - Catches issues before they cause problems

## ⚙️ Configuration System

The validator includes a comprehensive configuration system for customization:

```json
{
  "validation": {
    "thresholds": {
      "minCompleteness": {
        "en": 50,
        "ar": 95
      },
      "maxKeyLength": 50,
      "minKeyLength": 3
    },
    "rules": {
      "checkNestedObjects": true,
      "checkInvalidChars": true,
      "checkCaseConsistency": true,
      "checkReservedWords": true,
      "checkNamespacePatterns": true
    }
  },
  "performance": {
    "cacheEnabled": true,
    "cacheTimeout": 3600000,
    "parallelProcessing": true
  }
}
```

### 🔧 Configuration Options
- **Thresholds**: Set minimum completeness levels per language
- **Validation Rules**: Enable/disable specific validation checks
- **Performance**: Configure caching and processing options
- **CI/CD**: Customize workflow behavior

## 📋 Prerequisites

### 1. OpenAI API Key
```bash
# Get your API key from: https://platform.openai.com/api-keys
export OPENAI_API_KEY="your_api_key_here"
```

### 2. GitHub Token (for PR creation)
```bash
# Create token at: https://github.com/settings/tokens
# Required scopes: repo, workflow
export GITHUB_TOKEN="your_github_token_here"
```

## 🛠️ Quick Start

### Basic Translation (No PR)
```bash
# Translate Arabic to English
npm run translation:ai-translate -- --from ar --to en

# Translate English to Arabic
npm run translation:ai-translate -- --from en --to ar
```

### With GitHub PR Creation
```bash
# Full automation with PR
npm run translation:ai-translate \
  --from ar \
  --to en \
  --create-pr \
  --github-owner yourusername \
  --github-repo yourrepo \
  --yes
```

### Enhanced Validation Commands
```bash
# Export missing translations with smart classification
npm run translation:export-missing en

# Analyze source code for translation usage
npm run translation:scan

# Find unused translation keys
npm run translation:unused

# Find orphaned translations (exist but not used)
npm run translation:orphaned
```

**Smart Export Output:**
```
🔍 Analyzing translation completeness for en...
Scanning source code for translation usage...
⚠️  Found keys missing from ALL translation files:
   🔴 admin.login (no fallback)
   🟡 admin.bulkActionError (has fallback)

📊 EXPORT SUMMARY:
• Completely missing keys: 730
• Normal missing translations: 661
• Total: 1391
• 🔴 CRITICAL ISSUES: 450 keys without fallbacks
• 🟡 WARNING ISSUES: 280 keys with fallbacks
```

## 📊 Workflow Overview

### 1. Analysis Phase
- ✅ Validates API configuration
- ✅ Scans for missing translations
- ✅ Estimates translation costs
- ✅ Prepares translation tasks

### 2. Translation Phase
- 🤖 Uses OpenAI GPT-4 for high-quality translation
- 📝 Preserves technical terms and placeholders
- ⚡ Rate-limited for API compliance
- 📊 Real-time progress tracking

### 3. Integration Phase
- 💾 Updates translation files
- 🔗 Creates GitHub branch
- 📤 Commits translation changes
- 🔄 Creates pull request with detailed description

## 🎯 Usage Examples

### Example 1: Basic Translation
```bash
npm run translation:ai-translate -- --from ar --to en --yes
```

**Output:**
```
🚀 Starting Automated AI Translation Workflow
============================================================

🔧 Validating configuration...
✅ Configuration validated

📊 Step 1: Analyzing current translations...

🤖 Step 2: Preparing translations for AI processing...
📋 Prepared 661 translation tasks

💰 Estimated cost: $1.32 (661 translations)

🚀 Step 3: Executing AI translations...
✅ Translated: "المحافظة" → "Governorate"
✅ Translated: "جاري التحميل..." → "Loading..."
📊 Progress: 661/661 (661 ✅, 0 ❌)

📝 Step 4: Updating translation files...
✅ Applied: common.governorate = "Governorate"

💾 Step 5: Saving translation files...
💾 Saved: en/common.json

🎉 AUTOMATED TRANSLATION COMPLETED!
============================================================

📊 RESULTS:
   Language Pair: ar → en
   Total Translations: 661
   ✅ Successful: 661
   ❌ Failed: 0
   💰 Cost: $1.32
```

### Example 2: With GitHub PR
```bash
npm run translation:ai-translate \
  --from ar \
  --to en \
  --create-pr \
  --github-owner aliahdab \
  --github-repo caryo-marketplace \
  --github-branch main \
  --yes
```

**Creates PR like:**
```
🤖 AI Translation: ar → en (661 translations)

## 📊 Translation Summary
- **Language Pair**: ar → en
- **Total Translations**: 661
- **Successful**: 661
- **Failed**: 0
- **Estimated Cost**: $1.32

## 📁 Files Updated
- `public/locales/en/common.json` (2,345 chars)
- `public/locales/en/auth.json` (1,234 chars)

## 🔍 Review Notes
- ✅ All translations were generated using OpenAI GPT-4
- ✅ Preserved technical terminology and placeholders
- ✅ Maintained UI context and natural language flow
- ⚠️ Please review translations for accuracy and cultural appropriateness
```

## ⚙️ Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `--from, -f` | Source language | `ar` |
| `--to, -t` | Target language | `en` |
| `--create-pr` | Create GitHub PR | `false` |
| `--github-owner` | GitHub repo owner | - |
| `--github-repo` | GitHub repo name | - |
| `--github-branch` | Base branch | `main` |
| `--yes` | Skip confirmations | `false` |

## 🎨 Translation Quality Features

### Smart Translation
- **Context Awareness**: Uses translation context for better accuracy
- **Technical Term Preservation**: Keeps programming terms intact
- **Placeholder Handling**: Maintains `{{variable}}` and `{count}` patterns
- **Cultural Adaptation**: Considers UI context and natural language flow

### Quality Control
- **Cost Estimation**: Shows estimated API costs before translation
- **Progress Tracking**: Real-time progress with success/failure counts
- **Error Handling**: Graceful failure handling with retry logic
- **Validation**: Post-translation validation of results

## 🔧 Advanced Usage

### Enhanced Validation Features
```bash
# Detailed analysis with source scanning
npm run translation:summary

# Export with priority classification
npm run translation:export-missing en -- --detailed

# Find and analyze orphaned translations
npm run translation:orphaned -- --export orphaned.json

# Validate translation keys against naming conventions
npm run translation:validate

# Performance testing with caching demonstration
npm run translation:performance-test
```

### Understanding Priority Levels
- **🔴 Critical**: Keys without fallbacks - App may break
- **🟡 Warning**: Keys with fallbacks - App works but not fully internationalized
- **✅ Normal**: Standard missing translations between existing languages

### Integration with CI/CD
```yaml
# .github/workflows/translation-validation.yml
- name: Validate translations with priority analysis
  run: npm run translation:export-missing en
```

### Custom Translation Prompts
You can modify the translation prompts in `translation-service.js` for specific domain expertise:

```javascript
const systemPrompt = `You are a professional translator specializing in automotive software localization.
// ... customize prompts for your domain
```

### Rate Limiting
Adjust the rate limiting in `translation-service.js`:
```javascript
this.rateLimitDelay = 2000; // 2 seconds between requests
```

### Language Support
Add more languages in `translation-service.js`:
```javascript
const languageNames = {
  'en': 'English',
  'ar': 'Arabic',
  'fr': 'French',
  'de': 'German',
  // Add more languages
};
```

## 🛡️ Security & Best Practices

### API Key Security
- ✅ Never commit API keys to version control
- ✅ Use environment variables for sensitive data
- ✅ Rotate API keys regularly
- ✅ Monitor API usage and costs

### Quality Assurance
- ✅ Always review AI translations before merging
- ✅ Test translations in your application
- ✅ Consider having human translators review critical content
- ✅ Maintain a translation glossary for consistent terminology

## 📈 Cost Optimization

### Estimated Costs
- **GPT-4**: ~$0.03 per 1K tokens
- **Average translation**: ~100 tokens
- **Cost per translation**: ~$0.002

### Cost-Saving Tips
- ✅ Use `--yes` to skip confirmations
- ✅ Translate in batches when possible
- ✅ Monitor usage in OpenAI dashboard
- ✅ Consider GPT-3.5-turbo for simpler translations

## 🐛 Troubleshooting

### Common Issues

**"OpenAI API key not configured"**
```bash
export OPENAI_API_KEY="your_key_here"
```

**"GitHub token not configured"**
```bash
export GITHUB_TOKEN="your_token_here"
```

**"Rate limit exceeded"**
- Wait a few minutes and retry
- Reduce concurrent translations
- Increase rate limit delay

**"Translation quality issues"**
- Review and edit translations manually
- Customize translation prompts for your domain
- Consider human translators for critical content

## 🔄 Integration with CI/CD

### GitHub Actions Example
```yaml
name: AI Translation
on:
  workflow_dispatch:
    inputs:
      from_lang:
        description: 'Source language'
        required: true
        default: 'ar'
      to_lang:
        description: 'Target language'
        required: true
        default: 'en'

jobs:
  translate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run AI translation
        run: npm run translation:ai-translate -- --from ${{ inputs.from_lang }} --to ${{ inputs.to_lang }} --create-pr --github-owner ${{ github.repository_owner }} --github-repo ${{ github.event.repository.name }} --yes
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 📚 API Reference

### TranslationService
- `translateText(text, fromLang, toLang, context)` - Single translation
- `translateBatch(translations, fromLang, toLang)` - Batch translation
- `estimateCost(translations)` - Cost estimation

### GitHubService
- `createTranslationBranch(baseBranch)` - Create translation branch
- `uploadTranslationFiles(branchName, files)` - Upload files to GitHub
- `createPullRequest(branchName, title, description)` - Create PR

### AutomatedTranslator
- `run(options)` - Main workflow execution
- `validateConfiguration(options)` - Validate setup
- `prepareTranslationTasks(translations, missingKeys, options)` - Prepare tasks

---

## 🎯 Next Steps

1. **Set up API keys** in your environment
2. **Test with small batch** first (use `--yes` for automation)
3. **Review AI translations** for quality
4. **Customize prompts** for your specific domain
5. **Set up CI/CD integration** for automated workflows

**Happy translating! 🚀✨**
