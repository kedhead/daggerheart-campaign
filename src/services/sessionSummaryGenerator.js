/**
 * Summarize raw session notes into a polished narrative, grounded strictly in the
 * provided notes (no invention of new events/NPCs/outcomes). Uses /api/rules-chat
 * mode:'summarize', which reuses the existing key-fallback and provider-dispatch
 * plumbing already built for the 'chat'/'gm-plan' modes.
 *
 * @param {object} args
 * @param {string}  args.rawNotes        - Compiled live notes / highlights / dmNotes text
 * @param {string=} args.campaignContext - For correct NPC/location naming only, not new content
 * @param {string=} args.gameSystem
 * @param {string=} args.apiKey
 * @param {string=} args.provider        - 'anthropic' | 'openai'
 * @returns {Promise<string>} Polished summary prose
 */
export async function summarizeSessionNotes({
  rawNotes,
  campaignContext = '',
  gameSystem = 'daggerheart',
  apiKey,
  provider = 'anthropic'
}) {
  if (!rawNotes?.trim()) throw new Error('No session notes to summarize.');

  const response = await fetch('/api/rules-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: rawNotes,
      history: [],
      apiKey,
      provider,
      campaignContext,
      gameSystem,
      mode: 'summarize'
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(err.error || `Summarize request failed (HTTP ${response.status})`);
  }

  const data = await response.json();
  return (data.response || '').trim();
}
