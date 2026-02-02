import { useState } from 'react';
import { Monitor, ExternalLink, X, Eye, EyeOff, Zap, Youtube, Play, Trash2, Plus, Grid } from 'lucide-react';
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
  adversaries = [],
  initiative
}) {
  const campaignId = campaign?.id;
  const isDaggerheart = !campaign?.gameSystem || campaign.gameSystem === 'daggerheart';

  const {
    loading,
    fearCount,
    showFear,
    showInitiative,
    showNames,
    contentType,
    content,
    contentItems,
    incrementFear,
    decrementFear,
    resetFear,
    toggleFear,
    toggleInitiative,
    toggleNames,
    setDisplayContent,
    clearDisplay,
    addContentItem,
    removeContentItem,
    clearAllContent
  } = usePlayerDisplay(campaignId);

  const [displayWindow, setDisplayWindow] = useState(null);

  const openDisplayWindow = () => {
    const url = `${window.location.origin}?view=playerDisplay&campaign=${campaignId}`;
    const win = window.open(url, 'PlayerDisplay', 'width=1920,height=1080,menubar=no,toolbar=no,location=no,status=no');
    setDisplayWindow(win);
  };

  // Add content to display (supports multi-item)
  const handleContentSelect = async (type, contentData) => {
    await addContentItem(type, contentData);
  };

  // Remove a specific item from display
  const handleRemoveItem = async (itemId) => {
    await removeContentItem(itemId);
  };

  // Clear all content
  const handleClearContent = async () => {
    await clearAllContent();
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
          {contentItems.length > 0 && (
            <span className="preview-count">
              <Grid size={14} />
              {contentItems.length} item{contentItems.length !== 1 ? 's' : ''}
            </span>
          )}
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

            {/* Multi-item Grid Preview */}
            {contentItems.length > 0 ? (
              <div className={`preview-grid preview-grid-${Math.min(contentItems.length, 6)}`}>
                {contentItems.map(item => (
                  <div key={item.id} className="preview-grid-item">
                    {item.type === 'video' && getYouTubeVideoId(item.url) ? (
                      <img
                        src={`https://img.youtube.com/vi/${getYouTubeVideoId(item.url)}/mqdefault.jpg`}
                        alt={item.name || 'Video'}
                      />
                    ) : (
                      <img src={item.url} alt={item.name || 'Content'} />
                    )}
                    <button
                      className="preview-grid-remove"
                      onClick={() => handleRemoveItem(item.id)}
                      title="Remove from display"
                    >
                      <X size={12} />
                    </button>
                    {item.name && (
                      <span className="preview-grid-name">{item.name}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : content?.url ? (
              // Legacy single content display
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
                <span className="preview-hint">Click items below to add to display</span>
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

        {/* Show Names Toggle */}
        <div className="control-section card">
          <h3>Creature Names</h3>
          <div className="toggle-control">
            <label className="checkbox-control">
              <input
                type="checkbox"
                checked={showNames}
                onChange={toggleNames}
              />
              <span>Show Names on Display</span>
            </label>
            <span className={`status-badge ${showNames ? 'active' : 'inactive'}`}>
              {showNames ? (
                <>
                  <Eye size={14} />
                  Names Visible
                </>
              ) : (
                <>
                  <EyeOff size={14} />
                  Names Hidden
                </>
              )}
            </span>
            <p className="toggle-hint">Hide names until players identify the creatures</p>
          </div>
        </div>

        {/* Content Selector */}
        <div className="control-section card">
          <div className="section-header">
            <h3>Add to Display</h3>
            {(contentItems.length > 0 || content?.url) && (
              <button className="btn btn-ghost btn-sm" onClick={handleClearContent}>
                <Trash2 size={16} />
                Clear All
              </button>
            )}
          </div>
          <p className="section-hint">Click items to add them to the display. Multiple items will show in a grid.</p>
          <ContentSelector
            campaignId={campaignId}
            campaign={campaign}
            npcs={npcs}
            locations={locations}
            adversaries={adversaries}
            onSelectContent={handleContentSelect}
            currentContentItems={contentItems}
          />
        </div>
      </div>
    </div>
  );
}
