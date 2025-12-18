import { useState } from 'react';
import { aiService } from '../services/aiService';
import { promptBuilder } from '../services/promptBuilder';
import { responseParser } from '../services/responseParser';
import { templateService } from '../services/templateService';

/**
 * Hook for AI-powered content generation
 * Supports three modes: template, prompt, and API
 *
 * @returns {object} Generation functions and state
 */
export function useAIGeneration() {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  /**
   * Generate content using template/random mode
   * @param {string} type - Content type (npc, location, encounter)
   * @param {object} context - Optional context for customization
   * @returns {Promise<object>} Generated content
   */
  const generateFromTemplate = async (type, context = {}) => {
    setGenerating(true);
    setError(null);

    try {
      let generated;

      switch (type) {
        case 'npc':
          generated = templateService.generateRandomNPC(context);
          break;
        case 'location':
          generated = templateService.generateRandomLocation(context);
          break;
        case 'encounter':
          generated = templateService.generateRandomEncounter(context);
          break;
        default:
          throw new Error(`Unknown type: ${type}`);
      }

      setResult(generated);
      return generated;
    } catch (err) {
      console.error('Template generation error:', err);
      setError(err.message);
      throw err;
    } finally {
      setGenerating(false);
    }
  };

  /**
   * Generate a prompt for external AI use (copy/paste workflow)
   * @param {string} type - Content type
   * @param {object} context - Generation context
   * @returns {string} Generated prompt
   */
  const generatePrompt = (type, context) => {
    try {
      const prompt = promptBuilder.build(type, context);
      setGeneratedPrompt(prompt);
      return prompt;
    } catch (err) {
      console.error('Prompt generation error:', err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Parse pasted AI response
   * @param {string} type - Content type
   * @param {string} responseText - AI response text
   * @returns {object} Parsed content
   */
  const parsePastedResponse = (type, responseText) => {
    setGenerating(true);
    setError(null);

    try {
      const parsed = responseParser.parse(type, responseText);
      setResult(parsed);
      return parsed;
    } catch (err) {
      console.error('Response parsing error:', err);
      setError('Failed to parse response. Please check the format and try again.');
      throw err;
    } finally {
      setGenerating(false);
    }
  };

  // Generate content directly using API
  const generateWithAPI = async (type, context, apiKey, provider = 'anthropic') => {
    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      // Build prompt
      const prompt = promptBuilder.build(type, context);
      setGeneratedPrompt(prompt);

      // Call AI service
      const response = await aiService.generate(prompt, apiKey, provider);

      // Parse response
      const parsed = responseParser.parse(type, response);

      setResult(parsed);
      return parsed;
    } catch (err) {
      console.error('API generation error:', err);
      setError(err.message);
      throw err;
    } finally {
      setGenerating(false);
    }
  };

  // Generate campaign frame content
  const generateCampaignFrameContent = async (step, context, mode = 'template', apiKey = null, provider = 'anthropic') => {
    setGenerating(true);
    setError(null);

    try {
      if (mode === 'template') {
        // Use template service for campaign frame sections
        let generated;

        switch (step) {
          case 'pitch':
            generated = templateService.generatePitch({ ...context.requirements, campaign: context.campaign });
            break;
          case 'toneAndFeel':
            generated = templateService.generateToneAndFeel(6, { campaign: context.campaign });
            break;
          case 'themes':
            generated = templateService.generateThemes(5, { campaign: context.campaign });
            break;
          case 'playerPrinciples':
            generated = templateService.generatePlayerPrinciples(3);
            break;
          case 'gmPrinciples':
            generated = templateService.generateGMPrinciples(3);
            break;
          case 'incitingIncident':
            generated = templateService.generateIncitingIncident({ campaign: context.campaign });
            break;
          case 'sessionZeroQuestions':
            generated = templateService.generateSessionZeroQuestions(7);
            break;
          default:
            generated = '';
        }

        setResult(generated);
        return generated;
      } else if (mode === 'api') {
        // Use AI service
        if (!apiKey) {
          throw new Error('API key is required for API mode');
        }

        const prompt = promptBuilder.buildCampaignFramePrompt(step, context);
        setGeneratedPrompt(prompt);

        const response = await aiService.generate(prompt, apiKey, provider);

        // Determine parse type based on step
        const isArray = ['toneAndFeel', 'themes', 'touchstones', 'playerPrinciples', 'gmPrinciples', 'sessionZeroQuestions'].includes(step);
        const parseType = isArray ? 'array' : 'text';

        const parsed = responseParser.parse(parseType, response);

        setResult(parsed);
        return parsed;
      } else {
        throw new Error(`Unknown mode: ${mode}`);
      }
    } catch (err) {
      console.error('Campaign frame generation error:', err);
      setError(err.message);
      throw err;
    } finally {
      setGenerating(false);
    }
  };

  // Load a campaign frame template
  const loadCampaignFrameTemplate = (templateId) => {
    try {
      const template = templateService.loadTemplate(templateId);
      if (template) {
        setResult(template);
      }
      return template;
    } catch (err) {
      console.error('Template loading error:', err);
      setError(err.message);
      throw err;
    }
  };

  // Clear current generation state
  const clearGeneration = () => {
    setResult(null);
    setError(null);
    setGeneratedPrompt('');
    setGenerating(false);
  };

  return {
    // State
    generating,
    result,
    error,
    generatedPrompt,

    // Functions
    generateFromTemplate,
    generatePrompt,
    parsePastedResponse,
    generateWithAPI,
    generateCampaignFrameContent,
    loadCampaignFrameTemplate,
    clearGeneration
  };
}
