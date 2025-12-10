/**
 * AI Service for API integration
 * Supports Anthropic Claude and OpenAI GPT-4
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export const aiService = {
  /**
   * Generate content using Claude API (Anthropic)
   * @param {string} prompt - The prompt to send
   * @param {string} apiKey - Anthropic API key
   * @param {string} model - Model to use (default: claude-3-5-sonnet-20241022)
   * @returns {Promise<string>} Generated text
   */
  async generateWithClaude(prompt, apiKey, model = 'claude-3-5-sonnet-20241022') {
    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error('Claude API error:', error);
      throw this._formatError(error);
    }
  },

  /**
   * Generate content using OpenAI API
   * @param {string} prompt - The prompt to send
   * @param {string} apiKey - OpenAI API key
   * @param {string} model - Model to use (default: gpt-4-turbo-preview)
   * @returns {Promise<string>} Generated text
   */
  async generateWithOpenAI(prompt, apiKey, model = 'gpt-4-turbo-preview') {
    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant for creating Daggerheart TTRPG campaign content. Always respond in valid JSON format when requested.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw this._formatError(error);
    }
  },

  /**
   * Unified generation function
   * @param {string} prompt - The prompt to send
   * @param {string} apiKey - API key
   * @param {string} provider - 'anthropic' or 'openai'
   * @param {string} model - Optional model override
   * @returns {Promise<string>} Generated text
   */
  async generate(prompt, apiKey, provider = 'anthropic', model = null) {
    if (!apiKey) {
      throw new Error('API key is required');
    }

    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty');
    }

    // Simple client-side rate limiting
    this._checkRateLimit();

    if (provider === 'anthropic') {
      return this.generateWithClaude(prompt, apiKey, model);
    } else if (provider === 'openai') {
      return this.generateWithOpenAI(prompt, apiKey, model);
    } else {
      throw new Error(`Unknown provider: ${provider}. Use 'anthropic' or 'openai'.`);
    }
  },

  /**
   * Simple client-side rate limiting
   * Prevents too many requests in quick succession
   * @private
   */
  _checkRateLimit() {
    const now = Date.now();
    const lastRequest = localStorage.getItem('dh_last_ai_request');

    if (lastRequest) {
      const timeSinceLastRequest = now - parseInt(lastRequest);
      if (timeSinceLastRequest < 2000) { // 2 second minimum between requests
        throw new Error('Please wait a moment before making another request.');
      }
    }

    localStorage.setItem('dh_last_ai_request', now.toString());
  },

  /**
   * Format error messages to be user-friendly
   * @private
   */
  _formatError(error) {
    const message = error.message || 'Unknown error';

    // Check for common error patterns
    if (message.includes('API key')) {
      return new Error('Invalid API key. Please check your API key in settings.');
    }

    if (message.includes('rate limit') || message.includes('429')) {
      return new Error('Rate limit exceeded. Please wait a moment and try again.');
    }

    if (message.includes('network') || message.includes('fetch')) {
      return new Error('Network error. Please check your connection and try again.');
    }

    if (message.includes('timeout')) {
      return new Error('Request timed out. Please try again.');
    }

    if (message.includes('401') || message.includes('403')) {
      return new Error('Authentication failed. Please check your API key.');
    }

    // Return original error for unknown cases
    return error;
  },

  /**
   * Validate API key format (basic check)
   * @param {string} apiKey - API key to validate
   * @param {string} provider - Provider type
   * @returns {boolean} True if format appears valid
   */
  validateAPIKey(apiKey, provider) {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }

    if (provider === 'anthropic') {
      // Anthropic keys start with 'sk-ant-'
      return apiKey.startsWith('sk-ant-') && apiKey.length > 20;
    } else if (provider === 'openai') {
      // OpenAI keys start with 'sk-'
      return apiKey.startsWith('sk-') && apiKey.length > 20;
    }

    return false;
  }
};
