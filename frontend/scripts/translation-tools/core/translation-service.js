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

          // Set default OpenAI model if not specified
          if (!process.env.OPENAI_MODEL) {
            process.env.OPENAI_MODEL = 'gpt-4'; // Default to GPT-4 if not specified
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

      let model = process.env.OPENAI_MODEL || 'gpt-4';

      // Handle GPT-5 fallback (as of Sept 2025, GPT-5 isn't officially released)
      // If GPT-5 is requested but not available, fallback to GPT-4-turbo
      if (model === 'gpt-5') {
        console.log(`🤖 GPT-5 requested, but as of Sept 2025, OpenAI hasn't released a model officially called "GPT-5"`);
        console.log(`🤖 Falling back to GPT-4-turbo (which may have GPT-5-like capabilities)`);
        model = 'gpt-4-turbo';
      }

      console.log(`🤖 Using AI model: ${model}`);

      try {
        const response = await this.openai.chat.completions.create({
          model: model,
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

        return translatedText;

      } catch (error) {
        // If model is not available, try fallback to GPT-4-turbo
        if (error.message.includes('model') && error.message.includes('not found')) {
          console.log(`⚠️  Model "${model}" not available, trying GPT-4-turbo fallback...`);

          const fallbackResponse = await this.openai.chat.completions.create({
            model: 'gpt-4-turbo',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: text }
            ],
            temperature: 0.3,
            max_tokens: 500
          });

          const fallbackText = fallbackResponse.choices[0]?.message?.content?.trim();
          if (fallbackText) {
            console.log(`✅ Fallback successful with GPT-4-turbo`);
            return fallbackText;
          }
        }

        // Re-throw the original error if fallback also fails
        throw error;
      }

      console.log(`✅ Translation completed successfully`);
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
    let model = process.env.OPENAI_MODEL || 'gpt-4';

    // Handle GPT-5 fallback for cost estimation
    if (model === 'gpt-5') {
      model = 'gpt-4-turbo'; // Use GPT-4-turbo pricing for GPT-5 estimates
    }

    // OpenAI pricing as of mid-2024 (input/output costs per 1K tokens)
    const modelCosts = {
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
      'gpt-4': { input: 0.03, output: 0.06 }, // Non-turbo variant
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-5': { input: 0.04, output: 0.08 } // Estimated for hypothetical GPT-5
    };

    const costs = modelCosts[model] || modelCosts['gpt-4']; // Default to GPT-4

    // Estimate token usage (rough approximation)
    const estimatedInputTokens = translations.length * 120; // Prompt tokens
    const estimatedOutputTokens = translations.length * 30;  // Response tokens

    const inputCost = (estimatedInputTokens / 1000) * costs.input;
    const outputCost = (estimatedOutputTokens / 1000) * costs.output;
    const totalCost = inputCost + outputCost;

    return {
      itemCount: translations.length,
      estimatedInputTokens,
      estimatedOutputTokens,
      estimatedTotalTokens: estimatedInputTokens + estimatedOutputTokens,
      inputCostUSD: inputCost.toFixed(4),
      outputCostUSD: outputCost.toFixed(4),
      estimatedCostUSD: totalCost.toFixed(2),
      costPerItem: (totalCost / translations.length).toFixed(4),
      model: model.toUpperCase(),
      pricing: {
        inputPer1K: costs.input,
        outputPer1K: costs.output
      }
    };
  }
}

module.exports = TranslationService;
