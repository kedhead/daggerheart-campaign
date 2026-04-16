
import { useState, useRef, useEffect, useMemo } from 'react';
import { MessageSquare, Send, X, Bot, User, Minimize2, Loader2, BookOpen, Brain } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './ChatWidget.css';
import { useAPIKey } from '../../hooks/useAPIKey';
import { useEscapeKey } from '../../hooks/useKeyboardShortcut';
import { buildCampaignContext } from '../../services/campaignContext';

// Per-system configuration (single API endpoint, system chosen via request body)
const SYSTEM_CONFIG = {
  daggerheart: {
    systemLabel: 'Daggerheart',
    rulebookLabel: 'Powered by Daggerheart Rulebook',
    placeholder: 'Ask about the rules…',
    themeClass: '',
  },
  starwarsd6: {
    systemLabel: 'Star Wars D6',
    rulebookLabel: 'Powered by WEG D6 Rulebook',
    placeholder: 'Ask about the rules, the Force…',
    themeClass: 'sw-theme',
  },
};

export default function ChatWidget({
  userId,
  gameSystem   = 'daggerheart',
  campaign     = null,
  campaignFrame = null,
  characters   = [],
  npcs         = [],
  adversaries  = [],
  locations    = [],
  lore         = [],
  sessions     = [],
  encounters   = [],
}) {
    const config = SYSTEM_CONFIG[gameSystem] || SYSTEM_CONFIG.daggerheart;
    const [isOpen, setIsOpen] = useState(false);

    // Close on Escape
    useEscapeKey(() => setIsOpen(false), isOpen);

    // Build campaign context string — recomputed whenever any collection changes
    const campaignContext = useMemo(
      () => buildCampaignContext(campaign, {
        campaignFrame, characters, npcs, adversaries, locations, lore, sessions, encounters
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [campaign?.id, characters.length, npcs.length, adversaries.length,
       locations.length, lore.length, sessions.length, encounters.length]
    );

    const hasCampaign = !!campaign?.name;
    const welcomeMessage = hasCampaign
      ? `Hello! I know everything about **${campaign.name}** — its NPCs, locations, adversaries, lore, and recent sessions. Ask me about the campaign, the rules, or anything else!`
      : `Hello! I'm your ${config.systemLabel} rules assistant. Ask me anything about the game rules, character creation, or mechanics!`;

    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { role: 'assistant', content: welcomeMessage }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const { keys, sharedConfig, hasKey } = useAPIKey(userId);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        // Check for API key availability
        const hasAnthropic = hasKey('anthropic') || (sharedConfig && sharedConfig.hasAnthropicKey);
        const hasOpenAI = hasKey('openai') || (sharedConfig && sharedConfig.hasOpenaiKey);
        // We now support 1min.ai via server env var, so we always allow the request to proceed if other keys are missing
        const hasAnyKey = hasAnthropic || hasOpenAI || true;

        if (!input.trim() || isLoading) return;

        if (!hasAnyKey) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Please configure an API key in Settings > API Settings to use the chat features, or ask your GM if shared keys are enabled.'
            }]);
            return;
        }

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            // Determine provider and key to use
            let provider = '1min'; // Default to 1min if no other specific key is found
            let apiKey = '';

            // Prefer Anthropic if available (better for large context), otherwise OpenAI
            if (hasAnthropic && keys.anthropic) {
                provider = 'anthropic';
                apiKey = keys.anthropic;
            } else if (hasOpenAI && keys.openai) {
                provider = 'openai';
                apiKey = keys.openai;
            } else {
                // Use 1min or fallback
                provider = '1min';
                apiKey = '';
            }

            const response = await fetch('/api/rules-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    history: messages.slice(-10),
                    apiKey,
                    provider,
                    campaignContext,
                    gameSystem
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to get response');
            }

            const data = await response.json();

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response
            }]);

        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Sorry, I encountered an error: ${error.message}. Please try again.`
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`dh-chat-widget-container ${config.themeClass}`}>
            {isOpen && (
                <div className="dh-chat-window">
                    <div className="dh-chat-header">
                        <div className="dh-chat-icon">
                            {hasCampaign ? <Brain size={20} /> : <Bot size={20} />}
                        </div>
                        <div className="dh-chat-title">
                            <h3>{hasCampaign ? 'Campaign GM' : 'Rules Assistant'}</h3>
                            <p>{hasCampaign ? `Knows ${campaign.name}` : config.rulebookLabel}</p>
                        </div>
                        <button
                            className="btn-icon"
                            style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }}
                            onClick={() => setIsOpen(false)}
                        >
                            <Minimize2 size={18} />
                        </button>
                    </div>

                    <div className="dh-chat-messages">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`dh-message ${msg.role === 'user' ? 'user' : 'ai'}`}>
                                <div className="dh-message-avatar">
                                    {msg.role === 'user' ? <User size={16} /> : <BookOpen size={16} />}
                                </div>
                                <div className="dh-message-content">
                                    {msg.role === 'user' ? (
                                        msg.content
                                    ) : (
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="dh-message ai">
                                <div className="dh-message-avatar">
                                    <BookOpen size={16} />
                                </div>
                                <div className="typing-indicator">
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="dh-chat-input-area" onSubmit={handleSubmit}>
                        <textarea
                            ref={inputRef}
                            className="dh-chat-input"
                            placeholder={config.placeholder}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                            disabled={isLoading}
                            rows={1}
                        />
                        <button
                            type="submit"
                            className="dh-chat-send"
                            disabled={!input.trim() || isLoading}
                        >
                            {isLoading ? <Loader2 size={20} className="spin" /> : <Send size={20} />}
                        </button>
                    </form>
                </div>
            )}

            <button
                className={`dh-chat-toggle ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle Rules Chat"
            >
                {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
            </button>
        </div>
    );
}
