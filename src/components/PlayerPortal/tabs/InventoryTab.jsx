export default function InventoryTab({ character }) {
  const gold = character.gold ?? 0;
  const equippedItems = character.equippedItems || [];
  const inventoryText = typeof character.inventory === 'string' ? character.inventory : '';
  const notes = character.playerNotes || '';

  // Build item groups from equippedItems (catalog items) + inventory text
  const equipped = equippedItems.filter(i => i.equipped !== false);
  const carried  = equippedItems.filter(i => i.equipped === false && !i.consumable);
  const consumable = equippedItems.filter(i => i.consumable);

  const ItemCard = ({ item }) => (
    <div className="lrp-card" style={{ padding: '11px 13px', marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fdf6dc' }}>{item.name}</div>
          {item.note && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 3, lineHeight: 1.4 }}>{item.note}</div>
          )}
        </div>
        {item.quantity > 1 && (
          <div style={{
            minWidth: 28, height: 24, padding: '0 8px', borderRadius: 6,
            background: 'rgba(234,179,8,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: '#eab308',
          }}>×{item.quantity}</div>
        )}
      </div>
    </div>
  );

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

      {/* Equipped items from catalog */}
      {equipped.length > 0 && (
        <div>
          <div className="lrp-section-label">Equipped</div>
          {equipped.map((it, i) => <ItemCard key={it.id || i} item={it} />)}
        </div>
      )}
      {carried.length > 0 && (
        <div>
          <div className="lrp-section-label">Carried</div>
          {carried.map((it, i) => <ItemCard key={it.id || i} item={it} />)}
        </div>
      )}
      {consumable.length > 0 && (
        <div>
          <div className="lrp-section-label">Consumable</div>
          {consumable.map((it, i) => <ItemCard key={it.id || i} item={it} />)}
        </div>
      )}

      {/* Inventory free-text */}
      {inventoryText && (
        <div>
          <div className="lrp-section-label">Inventory</div>
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

      {equippedItems.length === 0 && !inventoryText && !gold && (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '40px 0', fontSize: 13 }}>
          No inventory recorded.
        </div>
      )}
    </div>
  );
}
