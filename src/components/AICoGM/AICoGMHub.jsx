import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, Bot, User, BookOpen, UsersRound, Package, Skull, ScrollText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useCampaignChat } from '../../hooks/useCampaignChat';
import GMAssistantPanel from '../Sessions/GMAssistantPanel';
import NPCForm from '../NPCs/NPCForm';
import ItemForm from '../Items/ItemForm';
import ItemAIModal from '../Items/ItemAIModal';
import AdversaryForm from '../Adversaries/AdversaryForm';
import Modal from '../Modal';
import { useAPIKey } from '../../hooks/useAPIKey';

/**
 * AI Co-GM Hub — a single DM-only page that brings together the campaign-aware
 * chat, the GM Assistant session planner, and quick-create shortcuts for
 * NPCs/items/adversaries in AI-generate mode. Every piece here is an existing
 * component reused as-is (GMAssistantPanel, NPCForm, ItemForm/ItemAIModal,
 * AdversaryForm) — this is an orchestration layer, not a rebuild.
 */
export default function AICoGMHub({
  campaign,
  campaignFrame,
  characters = [],
  npcs = [],
  adversaries = [],
  locations = [],
  lore = [],
  sessions = [],
  encounters = [],
  items = [],
  maps = [],
  battleMaps = [],
  storybookChapters = [],
  isDM,
  currentUserId,
  addSession,
  addEncounter,
  addAdversary,
  addNPC,
  addLocation,
  addLore,
  addItem,
  updateItem,
  setCurrentView
}) {
  const mergedMaps = [
    ...maps.map(m => ({ ...m, tag: 'map' })),
    ...battleMaps.map(m => ({ ...m, tag: 'battle-map' }))
  ];

  const { messages, input, setInput, isLoading, campaignContext, sendMessage } = useCampaignChat({
    userId: currentUserId,
    gameSystem: campaign?.gameSystem || 'daggerheart',
    campaign, campaignFrame, characters, npcs, adversaries, locations, lore, sessions, encounters,
    items, maps: mergedMaps, storybookChapters
  });

  const { getEffectiveKey } = useAPIKey(currentUserId);
  const anthropicInfo = getEffectiveKey('anthropic');
  const openaiInfo = getEffectiveKey('openai');
  const aiKey = anthropicInfo?.key || openaiInfo?.key || '';
  const aiProvider = anthropicInfo?.key ? 'anthropic' : 'openai';

  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [showNPCModal, setShowNPCModal] = useState(false);
  const [showAdversaryModal, setShowAdversaryModal] = useState(false);
  const [showItemAIModal, setShowItemAIModal] = useState(false);
  const [showItemFormModal, setShowItemFormModal] = useState(false);
  const [generatedItem, setGeneratedItem] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const handleItemGenerated = (item) => {
    setShowItemAIModal(false);
    setGeneratedItem(item);
    setShowItemFormModal(true);
  };

  const handleItemSave = async (itemData) => {
    await addItem(itemData);
    setShowItemFormModal(false);
    setGeneratedItem(null);
  };

  if (!isDM) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-white/5 rounded-xl p-6 text-center max-w-2xl mx-auto mt-10">
        <p className="text-white/60">AI Co-GM is available to Dungeon Masters only.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3 py-2">
        <Sparkles size={28} className="text-[rgb(var(--color-primary))]" />
        <div>
          <h2 className="text-3xl font-bold text-white font-cinzel">AI Co-GM</h2>
          <p className="text-white/60">
            Chat about your campaign, plan sessions, and quick-create content — all grounded in
            everything you've built so far.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Embedded chat panel ── */}
        <div className="bg-[var(--bg-secondary)] border border-white/5 rounded-xl p-5 flex flex-col gap-4 min-h-[420px] max-h-[70vh]">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <Bot size={18} className="text-[rgb(var(--color-primary))]" />
            <h3 className="text-lg font-bold text-white font-cinzel">Campaign Chat</h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${m.role === 'user' ? 'bg-[rgb(var(--color-primary))]/30' : 'bg-white/5'}`}>
                  {m.role === 'user' ? <User size={14} className="text-white" /> : <BookOpen size={14} className="text-white/70" />}
                </div>
                <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${m.role === 'user' ? 'bg-[rgb(var(--color-primary))]/20 text-white' : 'bg-black/20 text-white/85 border border-white/5'}`}>
                  {m.role === 'user' ? m.content : <ReactMarkdown>{m.content}</ReactMarkdown>}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <Loader2 size={14} className="animate-spin" />
                Thinking…
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 pt-2 border-t border-white/10">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your campaign, or brainstorm an idea…"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              disabled={isLoading}
              className="flex-1 p-3 bg-black/30 border border-white/10 rounded-lg text-white text-sm resize-none focus:outline-none focus:border-[rgb(var(--color-primary))]"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="btn btn-primary self-stretch px-4 flex items-center"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>

        {/* ── GM Assistant + quick-create ── */}
        <div className="space-y-6">
          <GMAssistantPanel
            campaign={campaign}
            campaignFrame={campaignFrame}
            characters={characters}
            npcs={npcs}
            adversaries={adversaries}
            locations={locations}
            lore={lore}
            sessions={sessions}
            encounters={encounters}
            items={items}
            maps={maps}
            battleMaps={battleMaps}
            storybookChapters={storybookChapters}
            isDM={isDM}
            currentUserId={currentUserId}
            handlers={{ addLocation, addNPC, addAdversary, addEncounter, addSession, addLore }}
          />

          <div className="bg-[var(--bg-secondary)] border border-white/5 rounded-xl p-5 space-y-3">
            <h3 className="text-lg font-bold text-white font-cinzel">Quick Create</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="btn btn-secondary flex flex-col items-center gap-2 py-4"
                onClick={() => setShowNPCModal(true)}
              >
                <UsersRound size={20} />
                New NPC
              </button>
              <button
                type="button"
                className="btn btn-secondary flex flex-col items-center gap-2 py-4"
                onClick={() => setShowAdversaryModal(true)}
              >
                <Skull size={20} />
                New Adversary
              </button>
              <button
                type="button"
                className="btn btn-secondary flex flex-col items-center gap-2 py-4"
                onClick={() => setShowItemAIModal(true)}
              >
                <Package size={20} />
                New Item
              </button>
              <button
                type="button"
                className="btn btn-secondary flex flex-col items-center gap-2 py-4"
                onClick={() => setCurrentView?.('sessions')}
              >
                <ScrollText size={20} />
                Summarize a Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick-create: NPC ── */}
      <Modal
        isOpen={showNPCModal}
        onClose={() => setShowNPCModal(false)}
        title="New Identity Entry"
        size="large"
      >
        <NPCForm
          onSave={async (npcData) => { await addNPC(npcData); setShowNPCModal(false); }}
          onCancel={() => setShowNPCModal(false)}
          isDM={isDM}
          campaign={campaign}
          entities={{ npcs, locations, lore, sessions, encounters, campaignFrame }}
          campaignContext={campaignContext}
          initialMode="ai"
        />
      </Modal>

      {/* ── Quick-create: Adversary ── */}
      <AdversaryForm
        isOpen={showAdversaryModal}
        onClose={() => setShowAdversaryModal(false)}
        onSave={async (advData) => { await addAdversary(advData); }}
        campaignAdversaries={adversaries}
        userId={currentUserId}
        campaignContext={campaignContext}
        initialMode="ai"
      />

      {/* ── Quick-create: Item (generate, then review/save) ── */}
      <ItemAIModal
        isOpen={showItemAIModal}
        onClose={() => setShowItemAIModal(false)}
        onGenerated={handleItemGenerated}
        apiKey={aiKey}
        provider={aiProvider}
        campaignContext={campaignContext}
      />
      <Modal
        isOpen={showItemFormModal}
        onClose={() => { setShowItemFormModal(false); setGeneratedItem(null); }}
        title="Review Generated Item"
        size="large"
      >
        <ItemForm
          item={generatedItem}
          gameSystem={campaign?.gameSystem || 'daggerheart'}
          onSave={handleItemSave}
          onCancel={() => { setShowItemFormModal(false); setGeneratedItem(null); }}
          campaign={campaign}
          isDM={isDM}
        />
      </Modal>
    </div>
  );
}
