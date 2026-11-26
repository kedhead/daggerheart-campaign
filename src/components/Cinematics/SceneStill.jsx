/**
 * A scene picture on the monitor: full screen, drifting slowly closer, with
 * its title for a moment. It stays until the DM skips or stops it.
 *
 * @param {object} props
 * @param {object} props.still - { imageUrl, title }
 */
export default function SceneStill({ still }) {
  if (!still?.imageUrl) return null;
  return (
    <div className="cs-still">
      <img className="cs-still-bg" src={still.imageUrl} alt="" aria-hidden="true" />
      <img className="cs-still-img" src={still.imageUrl} alt={still.title || 'Scene'} />
      {still.title && <div className="cs-still-title">{still.title}</div>}
    </div>
  );
}
