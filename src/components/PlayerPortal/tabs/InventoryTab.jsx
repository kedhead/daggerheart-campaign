import { getFeatureName, resolveFeature } from '../../../utils/itemFeatures';

const TYPE_ICON = { weapon: '⚔', armor: '🛡', equipment: '✦' };
const TYPE_COLOR = { weapon: '#f5c543', armor: '#60a5fa', equipment: '#a78bfa' };

function ItemStats({ item }) {
  const sd = item.systemData || {};
  const stats = [];
  if (item.type === 'armor') {
    if (sd.armorScore != null) stats.push(`Score ${sd.armorScore}`);
    if (sd.armorSlots != null) stats.push(`${sd.armorSlots} slots`);
    if (sd.burden) stats.push(sd.burden);
  } else if (item.type === 'weapon') {
    if (sd.trait)      stats.push(sd.trait);
    if (sd.range)      stats.push(sd.range);
    if (sd.damage)     stats.push(sd.damage);
    if (sd.damageType) stats.push(sd.damageType);
    if (sd.burden)     stats.push(sd.burden);
  } else if (item.type === 'equipment') {
    if (sd.mechanicalEffect) stats.push(sd.mechanicalEffect);
  }
  if (stats.length === 0) return null;
  return (
    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, marginTop: 4 }}>
      {stats.join(' · ')}
    </div>
  );
}

function ItemCard({ item, onRemove, onEquip, onUnequip, onStash }) {
  const sd = item.systemData || {};
  const features = sd.features || [];
  const describedFeatures = features.map(resolveFeature).filter(r => r.name && r.description);
  const tc = TYPE_COLOR[item.type] || '#a78bfa';

  return (
    <div className="lrp-card" style={{ borderColor: `${tc}22`, padding: '13px 14px', marginBottom: 0 }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13 }}>{TYPE_ICON[item.type] || '✦'}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fdf6dc' }}>{item.name}</span>
          </div>
          <ItemStats item={item} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {item.quantity > 1 && (
            <div style={{
              height: 22, padding: '0 7px', borderRadius: 6,
              background: 'rgba(234,179,8,0.15)', display: 'flex', alignItems: 'center',
              fontSize: 11, fontWeight: 800, color: '#eab308',
            }}>×{item.quantity}</div>
          )}
          {sd.tier != null && (
            <span style={{
              fontSize: 10, fontWeight: 800, color: tc,
              background: `${tc}18`, border: `1px solid ${tc}30`,
              borderRadius: 6, padding: '2px 6px', letterSpacing: '0.05em',
            }}>T{sd.tier}</span>
          )}
        </div>
      </div>

      {/* Feature badges */}
      {features.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
          {features.map((f, fi) => {
            const name = getFeatureName(f);
            if (!name) return null;
            return (
              <span key={fi} style={{
                fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                background: `${tc}18`, border: `1px solid ${tc}30`,
                color: tc, letterSpacing: '0.04em',
              }}>{name}</span>
            );
          })}
        </div>
      )}

      {/* Custom feature descriptions */}
      {describedFeatures.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {describedFeatures.map((f, fi) => (
            <div key={fi} style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.45 }}>
              <span style={{ fontWeight: 700, color: tc }}>{f.name}:</span>
              {' '}{f.description}
            </div>
          ))}
        </div>
      )}

      {/* Item description */}
      {item.description && (
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginTop: 8, fontStyle: 'italic' }}>
          {item.description}
        </div>
      )}

      {/* Custom note */}
      {item.note && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6, lineHeight: 1.4 }}>
          {item.note}
        </div>
      )}

      {/* Action buttons: equip / unequip / stash / expend */}
      {(onEquip || onUnequip || onStash || onRemove) && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          {onEquip && (
            <button onClick={onEquip} style={{
              padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
              background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.35)',
              color: '#4ade80', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', fontFamily: 'inherit',
            }}>
              Equip
            </button>
          )}
          {onUnequip && (
            <button onClick={onUnequip} style={{
              padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', fontFamily: 'inherit',
            }}>
              Unequip
            </button>
          )}
          {onStash && (
            <button onClick={onStash} style={{
              padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
              background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.35)',
              color: '#a78bfa', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', fontFamily: 'inherit',
            }}>
              → Party Stash
            </button>
          )}
          {onRemove && (
            <button onClick={onRemove} style={{
              padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#f87171', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', fontFamily: 'inherit',
            }}>
              Use / Expend
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function InventoryTab({ character, items, updateCharacter, stashFromCharacter }) {
  const gold = character.gold ?? 0;
  const inventoryText = typeof character.inventory === 'string' ? character.inventory : '';
  const notes = character.playerNotes || '';

  // Resolve equippedItems refs against the items catalog
  const resolvedItems = Array.isArray(character.equippedItems)
    ? character.equippedItems
        .map(ei => {
          const full = items?.find(i => i.id === ei.itemId);
          return full ? { ...full, ...ei } : (ei.name ? ei : null);
        })
        .filter(Boolean)
    : [];

  const equipped   = resolvedItems.filter(i => i.equipped !== false && !i.consumable);
  const carried    = resolvedItems.filter(i => i.equipped === false && !i.consumable);
  const consumable = resolvedItems.filter(i => i.consumable);

  const handleExpend = (item) => {
    if (!updateCharacter) return;
    const remaining = (character.equippedItems || []).filter(ei => ei.itemId !== item.itemId && ei.id !== item.id);
    updateCharacter(character.id, { equippedItems: remaining });
  };

  // Flip a single inventory entry's equipped state. Matches by itemId (and the
  // opposite current state, so equipped and carried copies of the same item
  // don't collide).
  const setEquipped = (item, value) => {
    if (!updateCharacter) return;
    const arr = [...(character.equippedItems || [])];
    const idx = arr.findIndex(ei =>
      (ei.itemId === item.itemId || (item.id && ei.id === item.id)) &&
      (value ? ei.equipped === false : ei.equipped !== false)
    );
    if (idx === -1) return;
    arr[idx] = { ...arr[idx], equipped: value };
    updateCharacter(character.id, { equippedItems: arr });
  };

  // Move an item to the party stash. `wasEquipped` disambiguates when the
  // player holds both an equipped and a carried copy of the same item.
  const handleStash = (item) => {
    if (!stashFromCharacter) return;
    const wasEquipped = item.equipped !== false;
    stashFromCharacter(character.id, item.itemId, wasEquipped);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Gold */}
      {gold > 0 && (
        <div>
          <div className="lrp-section-label">Gold</div>
          <div className="lrp-gold-card">
            <div style={{ textAlign: 'center' }}>
              <div className="lrp-cinzel" style={{ fontSize: 32, color: '#eab308', fontWeight: 800 }}>{gold}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, marginTop: 2 }}>
                Gold
              </div>
            </div>
          </div>
        </div>
      )}

      {equipped.length > 0 && (
        <div>
          <div className="lrp-section-label">Equipped</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {equipped.map((it, i) => (
              <ItemCard key={it.id || i} item={it}
                onUnequip={updateCharacter ? () => setEquipped(it, false) : undefined}
                onStash={stashFromCharacter ? () => handleStash(it) : undefined} />
            ))}
          </div>
        </div>
      )}

      {carried.length > 0 && (
        <div>
          <div className="lrp-section-label">Carried</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {carried.map((it, i) => (
              <ItemCard key={it.id || i} item={it}
                onEquip={updateCharacter ? () => setEquipped(it, true) : undefined}
                onStash={stashFromCharacter ? () => handleStash(it) : undefined} />
            ))}
          </div>
        </div>
      )}

      {consumable.length > 0 && (
        <div>
          <div className="lrp-section-label">Consumable</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {consumable.map((it, i) => (
              <ItemCard key={it.id || i} item={it}
                onRemove={() => handleExpend(it)}
                onStash={stashFromCharacter ? () => handleStash(it) : undefined} />
            ))}
          </div>
        </div>
      )}

      {/* Inventory free-text */}
      {inventoryText && (
        <div>
          <div className="lrp-section-label">Inventory Notes</div>
          <div style={{
            padding: '12px 14px', borderRadius: 12,
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, whiteSpace: 'pre-wrap',
          }}>
            {inventoryText}
          </div>
        </div>
      )}

      {/* Player notes */}
      {notes && (
        <div>
          <div className="lrp-section-label">Notes</div>
          <div style={{
            padding: '12px 14px', borderRadius: 12,
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, whiteSpace: 'pre-wrap',
          }}>
            {notes}
          </div>
        </div>
      )}

      {resolvedItems.length === 0 && !inventoryText && !gold && (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '40px 0', fontSize: 13 }}>
          No inventory recorded.
        </div>
      )}
    </div>
  );
}
