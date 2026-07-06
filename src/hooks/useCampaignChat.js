import { useState, useMemo } from 'react';
import { useAPIKey } from './useAPIKey';
import { buildCampaignContext } from '../services/campaignContext';

/**
 * Shared chat state/logic for the Campaign GM assistant — the messages array,
 * API-key resolution, campaignContext memoization, and the /api/rules-chat call.
 * Extracted from ChatWidget.jsx so both the floating chat bubble and the AI
 * Co-GM hub's embedded chat panel can share one implementation without forcing
 * either into the other's UI shape (floating window chrome stays in ChatWidget).
 *
 * @param {object} args
 * @param {string}   args.userId
 * @param {string=}  args.gameSystem
 * @param {object=}  args.campaign
 * @param {object=}  args.campaignFrame
 * @param {Array=}   args.characters, npcs, adversaries, locations, lore, sessions, encounters,
 *                    items, maps, storybookChapters
 * @param {string=}  args.welcomeMessage - Override the default greeting
 * @returns {{ messages, input, setInput, isLoading, campaignContext, sendMessage, hasCampaign, hasAnyKey }}
 */
export function useCampaignChat({
  userId,
  gameSystem = 'daggerheart',
  campaign = null,
  campaignFrame = null,
  characters = [],
  npcs = [],
  adversaries = [],
  locations = [],
  lore = [],
  sessions = [],
  encounters = [],
  items = [],
  maps = [],
  storybookChapters = [],
  welcomeMessage = null
}) {
  const { keys, sharedConfig, hasKey } = useAPIKey(userId);

  const campaignContext = useMemo(
    () => buildCampaignContext(campaign, {
      campaignFrame, characters, npcs, adversaries, locations, lore, sessions, encounters,
      items, maps, storybookChapters
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [campaign?.id, characters.length, npcs.length, adversaries.length, locations.length,
     lore.length, sessions.length, encounters.length, items.length, maps.length,
     storybookChapters.length]
  );

  const hasCampaign = !!campaign?.name;
  const defaultWelcome = hasCampaign
    ? `Hello! I know everything about **${campaign.name}** — its NPCs, locations, adversaries, items, maps, lore, story so far, and recent sessions. Ask me anything!`
    : `Hello! I'm your rules assistant. Ask me anything about the game rules, character creation, or mechanics!`;

  const [messages, setMessages] = useState([
    { role: 'assistant', content: welcomeMessage || defaultWelcome }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const hasAnthropic = hasKey('anthropic') || (sharedConfig && sharedConfig.hasAnthropicKey);
  const hasOpenAI = hasKey('openai') || (sharedConfig && sharedConfig.hasOpenaiKey);
  const hasAnyKey = hasAnthropic || hasOpenAI || true; // server env-var fallback always allows it

  const sendMessage = async (textOverride) => {
    const userMessage = (textOverride ?? input).trim();
    if (!userMessage || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      let provider = '1min';
      let apiKey = '';
      if (hasAnthropic && keys.anthropic) { provider = 'anthropic'; apiKey = keys.anthropic; }
      else if (hasOpenAI && keys.openai) { provider = 'openai'; apiKey = keys.openai; }

      const response = await fetch('/api/rules-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(-10),
          apiKey, provider, campaignContext, gameSystem
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Campaign chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, input, setInput, isLoading, campaignContext, sendMessage, hasCampaign, hasAnyKey };
}
