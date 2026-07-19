# Hope & Fear Integration Runbook

**Expansion:** Daggerheart: Hope & Fear — releases **2026-08-25** (~200 pages)
**Announced contents:** Witch, Warlock, Brawler, Assassin (2 subclasses each) ·
new **Dread** domain card set · **Transformations** (Vampire, Werewolf,
Reanimated, Shapeshifter, Ghost, Demigod) · new ancestries & communities ·
130+ adversaries · new environments · 4 campaign frames · GM guidance.

Everything below is pre-wired. On PDF day the job is: extract → paste into
one file → `npm test` → wire the two genuinely-new UI pieces.

---

## What is already scaffolded (shipped ahead of release)

| Piece | Where | Status |
| --- | --- | --- |
| Content-source registry + per-campaign gating | `src/data/sources.js` | ✅ live |
| Campaign settings toggle ("Content Sources") | Dashboard → Edit Campaign | ✅ live |
| Expansion data module (all content types, empty) | `src/data/hopeFear.js` | ✅ live |
| Merge points into every canonical catalog | see table below | ✅ live |
| Dread domain color/glyph | `SpellsTab.jsx` DOMAIN_COLORS/GLYPHS (`#7f1d1d`, 🕯) | ✅ live |
| Dread appears in DOMAINS only once cards exist | `systems/daggerheart.js` | ✅ live |
| Schema validators for every content type | `src/data/schemas.js` | ✅ live |
| Smoke tests validate ALL merged entries | `npm test` → "Hope & Fear readiness" | ✅ live |
| Adversary catalog respects source gating | `AdversariesView.jsx` | ✅ live |

### Merge points (no changes needed on PDF day — data flows automatically)

| Fill this in `hopeFear.js` | Lands in | Consumers that pick it up automatically |
| --- | --- | --- |
| `HF_CLASSES` / `HF_SUBCLASSES` | `CLASSES` / `SUBCLASSES` | character forms, creation wizard, level-up multiclass, portal, defenses (`baseEvasion`/`baseHp`), Hope-feature activation button |
| `HF_DOMAIN_CARDS` | `DOMAIN_CARDS` (+ auto-adds `Dread` to `DOMAINS`) | card pickers, loadout/vault, SpellsTab, recall costs, `getCardByName` |
| `HF_ANCESTRIES` / `HF_COMMUNITIES` | `ANCESTRIES` / `COMMUNITIES` | forms, FeaturesTab heritage sections |
| `HF_ADVERSARIES` | `DAGGERHEART_ADVERSARIES` (+BY_TIER/BY_ROLE) | catalog import, encounter builder, BP costs, fuzzy matcher, live tracker (thresholds/Difficulty display) |
| `HF_ENVIRONMENTS` | `DAGGERHEART_ENVIRONMENTS` | environment catalog, encounter builder |
| `HF_WEAPONS/ARMOR/EQUIPMENT/CONSUMABLES` | items catalog + `ALL_DAGGERHEART_ITEMS` | items view, defense calculator (`enrichFromCatalog`) |
| `HF_CAMPAIGN_FRAMES` | `CAMPAIGN_FRAME_TEMPLATES` | campaign builder frame picker |
| `HF_TRANSFORMATIONS` | (schema only — UI is a day-one task, below) | — |

---

## Day-one procedure

1. **Extract the text.** Upload the PDF to the assistant session (or run it
   through any text extractor). Save the raw text as `dh-hopefear.txt` in the
   repo root, next to `dh-rulebook.txt` — it becomes the cross-check corpus
   the same way the core text is used today.
2. **Fill `src/data/hopeFear.js` one content type at a time**, in this order
   (each step is independently testable):
   1. `HF_DOMAIN_CARDS` (Dread) → run `npm test` → Dread auto-joins `DOMAINS`.
   2. `HF_CLASSES` + `HF_SUBCLASSES` (Witch, Warlock, Brawler, Assassin).
      Add each class's **starting Evasion/HP** exactly as printed — the
      defense calculator reads them. Check whether any new class Hope
      feature has a passive component (like Rogue's Dodge +2 Evasion): if
      so, add its hook next to `hopeFeatureEvasion` in
      `src/utils/daggerheartDefenses.js`.
   3. `HF_ANCESTRIES` / `HF_COMMUNITIES`.
   4. `HF_ADVERSARIES` (biggest batch — remember the legacy threshold names:
      `thresholds.minor` = printed **Major** value, `thresholds.major` =
      printed **Severe**; minions are `hp: 1, thresholds: {minor: 0, major: 0}`).
   5. `HF_ENVIRONMENTS`, `HF_WEAPONS/ARMOR/...`, `HF_CAMPAIGN_FRAMES`.
   6. `HF_TRANSFORMATIONS`.
3. **`npm test` after every batch.** The "Hope & Fear readiness" section
   validates every entry against `src/data/schemas.js` and prints the exact
   field that's wrong. `npm run build` before shipping.
4. **Ship per batch** (normal branch → merge → push flow). Content is
   per-campaign gateable, so shipping partially-filled data is safe.

## Day-one UI work (the two genuinely new pieces)

1. **Transformations** — new mechanic, schema already fixed in `hopeFear.js`:
   - Character field: `character.transformation = 'vampire' | null` (+
     `transformationActive`? — decide once the rules text clarifies whether
     transformations toggle or are permanent).
   - Sheet + Portal FeaturesTab: render the transformation's features card
     (same pattern as the class Hope feature / heritage sections).
   - If a transformation grants stat changes, apply via the existing
     `modifiers` hook pattern in `computeDefenses` (see `hopeFeatureEvasion`
     and `computeAbilityDelta` for the two established patterns).
   - Character form: a Transformation select (gated by
     `isSourceEnabled(campaign, 'hope-fear')`).
2. **Class/heritage picker gating** — new classes/ancestries merge into the
   shared maps, which pickers read without campaign context. If any table
   actually disables Hope & Fear, filter class options where the campaign is
   in scope (`DaggerheartCharacterForm`, `CharacterCreationWizard`) with
   `isSourceEnabled(campaign, 'hope-fear')` + a `source` tag we add to
   `HF_CLASSES` entries. Skip if every campaign keeps the expansion on.

## Things to check in the PDF that may touch engine code

- **New conditions** beyond the core set → `DAGGERHEART_CONDITIONS` in
  `useActiveEncounter.js`.
- **New weapon/armor feature keywords** (Protective/Barrier/Heavy-style) →
  `NAMED_FEATURES` + the bonus logic in `src/utils/daggerheartDefenses.js`
  (free-text "+N armor/evasion" already parses automatically).
- **New adversary roles or a tier-5** → role sets in `schemas.js`,
  `BPCalculator.jsx` costs, `fallbackAdversaryStats`, smoke tests.
- **Level cap / advancement changes** → `ADVANCEMENT_OPTIONS`,
  `getTierForLevel`, LevelUpWizard.
- **New damage types** beyond phy/mag → `parseDamageNotation` in the dice
  module and threshold entry in `ParticipantCard`.
- **AI text sanitizer** — if the expansion introduces new terminology the
  generator should respect, extend `sanitizeDaggerheartText` tests.
- **Demiplane import** — if players buy Hope & Fear on Demiplane/Nexus,
  check `DemiplaneImportModal` field mapping against a sample export.

## Quick reference: entry examples

```js
// Adversary
{ name: 'Grave Warden', tier: 3, role: 'bruiser', description: '…',
  motives: 'Guard, entomb, silence', difficulty: 16,
  thresholds: { minor: 22, major: 40 },   // printed Major / Severe
  hp: 7, stress: 4, attack: 3, attackName: 'Crypt Maul',
  attackRange: 'Melee', attackDamage: '3d8+4 phy',
  features: [{ name: 'Unyielding', type: 'passive', description: '…' }] }

// Dread domain card
{ name: 'Curse of Ash', domain: 'Dread', level: 1, type: 'Spell',
  recallCost: 1, description: '…' }

// Transformation
{ key: 'vampire', name: 'Vampire', description: '…',
  features: [{ name: 'Hunger', type: 'passive', description: '…' }],
  modifiers: { evasion: 1 } }
```
