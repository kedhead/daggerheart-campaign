
import { useState, useRef, useEffect, useMemo } from 'react';
import { MessageSquare, Send, X, Bot, User, Minimize2, Loader2, BookOpen, Brain } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './ChatWidget.css';
import { useEscapeKey } from '../../hooks/useKeyboardShortcut';
import { useCampaignChat } from '../../hooks/useCampaignChat';

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

const MIN_SIZE = { width: 320, height: 400 };
const DEFAULT_SIZE = { width: 380, height: 600 };
const SIZE_STORAGE_KEY = 'dhChatWindowSize';

function loadStoredSize() {
    try {
        const raw = localStorage.getItem(SIZE_STORAGE_KEY);
        if (!raw) return DEFAULT_SIZE;
        const parsed = JSON.parse(raw);
        return {
            width: Math.max(MIN_SIZE.width, Number(parsed.width) || DEFAULT_SIZE.width),
            height: Math.max(MIN_SIZE.height, Number(parsed.height) || DEFAULT_SIZE.height),
        };
    } catch {
        return DEFAULT_SIZE;
    }
}

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
  items        = [],
  maps         = [],
  battleMaps   = [],
  storybookChapters = [],
}) {
    const config = SYSTEM_CONFIG[gameSystem] || SYSTEM_CONFIG.daggerheart;
    const [isOpen, setIsOpen] = useState(false);
    const [size, setSize] = useState(loadStoredSize);

    // Close on Escape
    useEscapeKey(() => setIsOpen(false), isOpen);

    // Merge the two map collections into one tagged list for the context builder
    const mergedMaps = useMemo(() => [
      ...maps.map(m => ({ ...m, tag: 'map' })),
      ...battleMaps.map(m => ({ ...m, tag: 'battle-map' }))
    ], [maps, battleMaps]);

    const welcomeMessage = campaign?.name
      ? undefined // let useCampaignChat build the default "I know everything about..." greeting
      : `Hello! I'm your ${config.systemLabel} rules assistant. Ask me anything about the game rules, character creation, or mechanics!`;

    const {
      messages, input, setInput, isLoading, sendMessage, hasCampaign
    } = useCampaignChat({
      userId, gameSystem, campaign, campaignFrame, characters, npcs, adversaries, locations,
      lore, sessions, encounters, items, maps: mergedMaps, storybookChapters, welcomeMessage
    });

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

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

    // iOS Safari: when the on-screen keyboard appears, position:fixed elements
    // anchor to the layout viewport (which doesn't shrink), so the input area
    // ends up below the keyboard. Track visualViewport.height and expose it as
    // a CSS variable so the mobile-fullscreen chat window can size to the
    // actually-visible area.
    useEffect(() => {
        if (!isOpen) return undefined;
        const vv = window.visualViewport;
        if (!vv) return undefined;
        const update = () => {
            document.documentElement.style.setProperty('--chat-vvh', `${vv.height}px`);
        };
        update();
        vv.addEventListener('resize', update);
        vv.addEventListener('scroll', update);
        return () => {
            vv.removeEventListener('resize', update);
            vv.removeEventListener('scroll', update);
            document.documentElement.style.removeProperty('--chat-vvh');
        };
    }, [isOpen]);

    const handleResizeStart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startY = e.clientY;
        const startW = size.width;
        const startH = size.height;

        const onMove = (ev) => {
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;
            // Anchored bottom-right: dragging up-left (negative dx/dy) grows the window
            const maxW = Math.max(MIN_SIZE.width, window.innerWidth - 48);
            const maxH = Math.max(MIN_SIZE.height, window.innerHeight - 120);
            const w = Math.min(maxW, Math.max(MIN_SIZE.width, startW - dx));
            const h = Math.min(maxH, Math.max(MIN_SIZE.height, startH - dy));
            setSize({ width: w, height: h });
        };

        const onUp = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            setSize((curr) => {
                try { localStorage.setItem(SIZE_STORAGE_KEY, JSON.stringify(curr)); } catch { /* ignore */ }
                return curr;
            });
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage();
    };

    return (
        <div className={`dh-chat-widget-container ${config.themeClass}`}>
            {isOpen && (
                <div
                    className="dh-chat-window"
                    style={{ width: size.width, height: size.height }}
                >
                    <div
                        className="dh-chat-resize-handle"
                        onPointerDown={handleResizeStart}
                        role="separator"
                        aria-label="Resize chat window"
                        aria-orientation="vertical"
                    />
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
