import './SpecialResultOverlay.css';

export default function SpecialResultOverlay({ type, value, onClose }) {
    if (!type) return null;

    return (
        <div className={`dr-overlay dr-overlay-${type}`} onClick={onClose}>
            <div className="dr-overlay-content">
                {type === 'crit' && (
                    <>
                        <div className="dr-overlay-icon">⚔️</div>
                        <div className="dr-overlay-text">CRITICAL HIT!</div>
                        <div className="dr-overlay-sub">Natural 20</div>
                    </>
                )}
                {type === 'critfail' && (
                    <>
                        <div className="dr-overlay-icon">💀</div>
                        <div className="dr-overlay-text">CRITICAL FAIL</div>
                        <div className="dr-overlay-sub">Natural 1</div>
                    </>
                )}
                {type === 'doubles' && (
                    <>
                        <div className="dr-overlay-icon">✨</div>
                        <div className="dr-overlay-text">DOUBLES!</div>
                        <div className="dr-overlay-sub">{value} & {value}</div>
                    </>
                )}
            </div>
        </div>
    );
}
