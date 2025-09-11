const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

/**
 * Professional AI Translation Service
 * Uses OpenAI GPT-3.5-turbo for high-quality translations
 */
class TranslationService {
  constructor() {
    // Automatically load .env.local if API key is not set
    this.loadEnvFile();

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.rateLimitDelay = 1000; // 1 second between requests
    this.lastRequestTime = 0;
  }

  /**
   * Load environment variables from .env.local file
   */
  loadEnvFile() {
    if (process.env.OPENAI_API_KEY) {
      // Already set, no need to load
      return;
    }

    const envPaths = [
      path.join(process.cwd(), '.env.local'),
      path.join(process.cwd(), '..', '.env.local'),
      path.join(process.cwd(), '..', '..', '.env.local')
    ];

    for (const envPath of envPaths) {
      try {
        if (fs.existsSync(envPath)) {
          console.log(`📄 Loading environment from: ${envPath}`);
          const envContent = fs.readFileSync(envPath, 'utf8');
          const lines = envContent.split('\n');

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
              const [key, ...valueParts] = trimmedLine.split('=');
              if (key && valueParts.length > 0) {
                const value = valueParts.join('=').replace(/^['"]|['"]$/g, ''); // Remove quotes
                process.env[key.trim()] = value.trim();
              }
            }
          }

          console.log('✅ Environment variables loaded successfully');
          break; // Stop after loading first found file
        }
      } catch (error) {
        // Continue to next path
      }
    }
  }

  /**
   * Check if OpenAI API is configured
   */
  isConfigured() {
    return !!process.env.OPENAI_API_KEY;
  }

  /**
   * Translate text using OpenAI GPT-3.5-turbo
   * @param {string} text - Text to translate
   * @param {string} fromLang - Source language (e.g., 'en')
   * @param {string} toLang - Target language (e.g., 'ar')
   * @param {string} context - Translation context
   * @returns {Promise<string>} Translated text
   */
  async translateText(text, fromLang, toLang, context = '') {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY environment variable.');
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();

    try {
      const languageNames = {
        'en': 'English',
        'ar': 'Arabic',
        'fr': 'French',
        'de': 'German',
        'es': 'Spanish',
        'it': 'Italian',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'zh': 'Chinese',
        'ja': 'Japanese'
      };

      const sourceLangName = languageNames[fromLang] || fromLang;
      const targetLangName = languageNames[toLang] || toLang;

      const systemPrompt = `You are a professional translator specializing in software localization.
Translate the following text from ${sourceLangName} to ${targetLangName}.

Guidelines:
- Maintain technical accuracy for software terms
- Keep consistent terminology throughout
- Preserve placeholders like {{variable}}, {count}, etc.
- Use natural, fluent language appropriate for user interfaces
- Consider the context: ${context || 'user interface text'}
- Return only the translated text, no explanations

Text to translate: "${text}"`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.3, // Lower temperature for more consistent translations
        max_tokens: 500
      });

      const translatedText = response.choices[0]?.message?.content?.trim();

      if (!translatedText) {
        throw new Error('No translation received from OpenAI');
      }

      console.log(`✅ Translated: "${text}" → "${translatedText}"`);

      return translatedText;
    } catch (error) {
      console.error(`❌ Translation failed for "${text}":`, error.message);
      return text; // Return original text if translation fails
    }
  }

  /**
   * Translate multiple keys in batch
   * @param {Array<{key: string, text: string, context: string}>} translations - Array of translations to process
   * @param {string} fromLang - Source language
   * @param {string} toLang - Target language
   * @returns {Promise<Array<{key: string, original: string, translated: string, context: string}>>}
   */
  async translateBatch(translations, fromLang, toLang) {
    console.log(`\n🚀 Starting AI translation batch: ${translations.length} items`);
    console.log(`📍 From ${fromLang} to ${toLang}`);
    console.log('=' .repeat(60));

    const results = [];
    let completed = 0;
    let successCount = 0;
    let errorCount = 0;

    for (const item of translations) {
      try {
        const translatedText = await this.translateText(item.text, fromLang, toLang, item.context);
        results.push({
          key: item.key,
          original: item.text,
          translated: translatedText,
          context: item.context,
          success: true
        });
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to translate "${item.key}":`, error.message);
        results.push({
          key: item.key,
          original: item.text,
          translated: item.text, // Keep original on error
          context: item.context,
          success: false,
          error: error.message
        });
        errorCount++;
      }

      completed++;
      if (completed % 5 === 0 || completed === translations.length) {
        console.log(`📊 Progress: ${completed}/${translations.length} (${successCount} ✅, ${errorCount} ❌)`);
      }
    }

    console.log('=' .repeat(60));
    console.log(`✅ Batch translation completed!`);
    console.log(`📈 Success: ${successCount}, Errors: ${errorCount}`);

    return results;
  }

  /**
   * Estimate cost for translation batch
   * @param {Array} translations - Array of translations
   * @returns {Object} Cost estimate
   */
  estimateCost(translations) {
    // Rough estimate: GPT-3.5-turbo costs ~$0.002 per 1K tokens
    // Average translation is ~100 tokens for prompt + response
    const estimatedTokens = translations.length * 100;
    const estimatedCost = (estimatedTokens / 1000) * 0.002;

    return {
      itemCount: translations.length,
      estimatedTokens,
      estimatedCostUSD: estimatedCost.toFixed(2),
      costPerItem: (estimatedCost / translations.length).toFixed(4)
    };
  }
}

module.exports = TranslationService;
