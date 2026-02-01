import { useState } from 'react';
import { Monitor, ExternalLink, X, Eye, EyeOff, Zap, Youtube, Play } from 'lucide-react';
import { usePlayerDisplay } from '../../hooks/usePlayerDisplay';
import FearControl from './FearControl';
import ContentSelector from './ContentSelector';
import './DMDisplayControl.css';

// Extract YouTube video ID for thumbnail
function getYouTubeVideoId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default function DMDisplayControl({
  campaign,
  npcs = [],
  locations = [],
  initiative
}) {
  const campaignId = campaign?.id;
  const isDaggerheart = !campaign?.gameSystem || campaign.gameSystem === 'daggerheart';

  const {
    loading,
    fearCount,
    showFear,
    showInitiative,
    contentType,
    content,
    incrementFear,
    decrementFear,
    resetFear,
    toggleFear,
    toggleInitiative,
    setDisplayContent,
    clearDisplay
  } = usePlayerDisplay(campaignId);

  const [displayWindow, setDisplayWindow] = useState(null);

  const openDisplayWindow = () => {
    const url = `${window.location.origin}?view=playerDisplay&campaign=${campaignId}`;
    const win = window.open(url, 'PlayerDisplay', 'width=1920,height=1080,menubar=no,toolbar=no,location=no,status=no');
    setDisplayWindow(win);
  };

  const handleContentSelect = async (type, contentData) => {
    await setDisplayContent(type, contentData);
  };

  const handleClearContent = async () => {
    await clearDisplay();
  };

  if (loading) {
    return (
      <div className="dm-display-control">
        <div className="view-header">
          <div>
            <h2>Player Display</h2>
            <p className="view-subtitle">Loading...</p>
          </div>
        </div>
        <div className="loading-view">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dm-display-control">
      <div className="view-header">
        <div>
          <h2>Player Display</h2>
          <p className="view-subtitle">Control what players see on the shared display</p>
        </div>
        <button className="btn btn-primary" onClick={openDisplayWindow}>
          <ExternalLink size={20} />
          Open Display Window
        </button>
      </div>

      {/* Preview */}
      <div className="display-preview card">
        <div className="preview-header">
          <Monitor size={20} />
          <span>Preview</span>
        </div>
        <div className="preview-content">
          <div className="preview-screen">
            {/* Mini Fear Counter */}
            {isDaggerheart && showFear && (
              <div className="preview-fear">
                <span className="preview-fear-label">FEAR</span>
                <span className="preview-fear-number">{fearCount}</span>
              </div>
            )}

            {/* Mini Initiative */}
            {showInitiative && initiative?.active && (
              <div className="preview-initiative">
                <Zap size={12} />
                <span>R{initiative.round}</span>
                <span className="preview-participants">
                  {initiative.participants?.length || 0} in combat
                </span>
              </div>
            )}

            {/* Content Preview */}
            {content?.url ? (
              contentType === 'video' ? (
                <div className="preview-image-container preview-video">
                  {getYouTubeVideoId(content.url) ? (
                    <>
                      <img
                        src={`https://img.youtube.com/vi/${getYouTubeVideoId(content.url)}/mqdefault.jpg`}
                        alt={content.name || 'YouTube video'}
                      />
                      <div className="preview-play-overlay">
                        <Play size={24} />
                      </div>
                    </>
                  ) : (
                    <Youtube size={32} />
                  )}
                  {content.showName && content.name && (
                    <div className="preview-caption">{content.name}</div>
                  )}
                </div>
              ) : (
                <div className="preview-image-container">
                  <img src={content.url} alt={content.name || 'Display content'} />
                  {content.showName && content.name && (
                    <div className="preview-caption">{content.name}</div>
                  )}
                </div>
              )
            ) : (
              <div className="preview-empty">
                <Monitor size={32} />
                <span>No content displayed</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="control-sections">
        {/* Fear Control - Daggerheart only */}
        {isDaggerheart && (
          <div className="control-section card">
            <h3>Fear Counter</h3>
            <FearControl
              fearCount={fearCount}
              showFear={showFear}
              onIncrement={incrementFear}
              onDecrement={decrementFear}
              onReset={resetFear}
              onToggleShow={toggleFear}
            />
          </div>
        )}

        {/* Initiative Toggle */}
        <div className="control-section card">
          <h3>Initiative Display</h3>
          <div className="toggle-control">
            <label className="checkbox-control">
              <input
                type="checkbox"
                checked={showInitiative}
                onChange={toggleInitiative}
              />
              <span>Show Initiative on Display</span>
            </label>
            {initiative?.active ? (
              <span className="status-badge active">
                <Zap size={14} />
                Combat Active - Round {initiative.round}
              </span>
            ) : (
              <span className="status-badge inactive">No active combat</span>
            )}
          </div>
        </div>

        {/* Content Selector */}
        <div className="control-section card">
          <div className="section-header">
            <h3>Display Content</h3>
            {content?.url && (
              <button className="btn btn-ghost btn-sm" onClick={handleClearContent}>
                <X size={16} />
                Clear Display
              </button>
            )}
          </div>
          <ContentSelector
            campaignId={campaignId}
            campaign={campaign}
            npcs={npcs}
            locations={locations}
            onSelectContent={handleContentSelect}
            currentContent={content}
          />
        </div>
      </div>
    </div>
  );
}
