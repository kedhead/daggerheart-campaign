// The Alchemy homebrew module (see utils/homebrew.js): a character's satchel
// of ingredients, the concoctions brewed from them, and what happens when a
// dose is taken. Pure, so the smoke tests cover it; the Satchel component
// does the saving, the dice and the AI call.
//
// Stored on the character as `satchel`:
//   { ingredients: [{ id, name, qty, notes }],
//     concoctions: [{ id, name, description, ingredients, hopeEffect, fearEffect, critEffect, doses, maxDoses }],
//     log: [{ id, at, concoction, outcome, effect, hope, fear }] }

const MAX_LOG = 20;
const str = (v, n) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const newId = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

export function normalizeSatchel(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  return {
    ingredients: (Array.isArray(s.ingredients) ? s.ingredients : []).filter(i => i?.name),
    concoctions: (Array.isArray(s.concoctions) ? s.concoctions : []).filter(c => c?.name),
    log: (Array.isArray(s.log) ? s.log : []).slice(0, MAX_LOG)
  };
}

/** Add an ingredient, stacking onto one of the same name. */
export function addIngredient(satchel, { name, qty = 1, notes = '' }) {
  const s = normalizeSatchel(satchel);
  const clean = str(name, 80);
  if (!clean) return s;
  const n = Math.max(1, Math.round(Number(qty) || 1));
  const same = s.ingredients.find(i => i.name.toLowerCase() === clean.toLowerCase());
  if (same) {
    return { ...s, ingredients: s.ingredients.map(i => (i === same ? { ...i, qty: (Number(i.qty) || 0) + n, notes: i.notes || str(notes, 300) } : i)) };
  }
  return { ...s, ingredients: [...s.ingredients, { id: newId('ing'), name: clean, qty: n, notes: str(notes, 300) }] };
}

/** Change an ingredient's quantity; at zero it leaves the satchel. */
export function adjustIngredient(satchel, id, delta) {
  const s = normalizeSatchel(satchel);
  return {
    ...s,
    ingredients: s.ingredients
      .map(i => (i.id === id ? { ...i, qty: Math.max(0, (Number(i.qty) || 0) + delta) } : i))
      .filter(i => i.qty > 0)
  };
}

/** Use one of each chosen ingredient. */
export function consumeIngredients(satchel, ids) {
  return ids.reduce((s, id) => adjustIngredient(s, id, -1), normalizeSatchel(satchel));
}

/** The prompt for brewing a concoction from the chosen ingredients. */
export function buildBrewPrompt(ingredients, character = {}) {
  const level = Math.max(1, Number(character.level) || 1);
  const tier = level <= 1 ? 1 : level <= 4 ? 2 : level <= 7 ? 3 : 4;
  const list = ingredients.map(i => `- ${i.name}${i.notes ? ` (${i.notes})` : ''}`).join('\n');
  return `You are the alchemy engine for a Daggerheart campaign's homebrew rule. ${character.name || 'A character'}${character.class ? `, a level ${level} ${character.class}` : ` (level ${level})`}, combines these ingredients into a concoction they will take:
${list}

When they take a dose they roll the Duality dice: with Hope the good effect happens, with Fear the bad one, and on doubles (a critical) the critical effect. Invent the concoction those ingredients would make together.

Rules:
- Name it like street alchemy: evocative, two to four words.
- "description": what it looks, smells and tastes like and how it's taken (smoked, swallowed, rubbed into the gums…), in 1-2 sentences that draw on the ingredients.
- "hopeEffect": a clear benefit in Daggerheart terms, sized for tier ${tier}: e.g. advantage on a kind of roll for the scene, +1 to a trait until the end of the scene, clear Stress, gain a Hope, +1 Evasion, resist a condition, see in darkness. One or two parts, no more.
- "fearEffect": a real cost in Daggerheart terms: e.g. mark Stress, become Vulnerable, disadvantage on a kind of roll, lose a Hope, a vivid hallucination the GM narrates, the GM gains a Fear. It should sting but not end the character.
- "critEffect": what doubles do: the Hope effect, stronger or lasting longer, with a flourish.
- "doses": 1 to 3.
- Effects follow from the ingredients' natures. Concrete and playable at the table: say what to roll or mark and for how long.

Answer with JSON only: {"name": "...", "description": "...", "hopeEffect": "...", "fearEffect": "...", "critEffect": "...", "doses": number}`;
}

/** A concoction from the model's answer, or null. */
export function parseConcoction(text, ingredients = []) {
  const json = String(text || '').match(/\{[\s\S]*\}/);
  if (!json) return null;
  let raw;
  try { raw = JSON.parse(json[0]); } catch { return null; }
  const c = {
    name: str(raw.name, 80),
    description: str(raw.description, 400),
    hopeEffect: str(raw.hopeEffect, 400),
    fearEffect: str(raw.fearEffect, 400),
    critEffect: str(raw.critEffect, 400),
    doses: Math.max(1, Math.min(3, Math.round(Number(raw.doses) || 1)))
  };
  if (!c.name || !c.hopeEffect || !c.fearEffect) return null;
  return { ...c, maxDoses: c.doses, ingredients: ingredients.map(i => i.name) };
}

/** Put a brewed concoction in the satchel, using one of each ingredient. */
export function keepConcoction(satchel, concoction, ingredientIds) {
  const s = consumeIngredients(satchel, ingredientIds);
  return { ...s, concoctions: [{ id: newId('brew'), ...concoction }, ...s.concoctions] };
}

/** Which effect a Duality roll triggers: 'crit' on doubles, else 'hope' or 'fear'. */
export function doseOutcome(roll) {
  if (roll?.flags?.isDoubles) return 'crit';
  return roll?.outcome === 'fear' ? 'fear' : 'hope';
}

export function effectFor(concoction, outcome) {
  if (outcome === 'crit') return concoction.critEffect || concoction.hopeEffect;
  return outcome === 'fear' ? concoction.fearEffect : concoction.hopeEffect;
}

/** Take a dose: one fewer left, and the result at the top of the log. */
export function takeDose(satchel, concoctionId, roll) {
  const s = normalizeSatchel(satchel);
  const c = s.concoctions.find(x => x.id === concoctionId);
  if (!c || !(c.doses > 0)) return { satchel: s, outcome: null, effect: '' };
  const outcome = doseOutcome(roll);
  const effect = effectFor(c, outcome);
  const dieValue = (group) => (roll?.dice || []).find(d => d.groupId === group)?.value ?? null;
  const entry = { id: newId('dose'), at: Date.now(), concoction: c.name, outcome, effect, hope: dieValue('hope'), fear: dieValue('fear') };
  return {
    satchel: {
      ...s,
      concoctions: s.concoctions.map(x => (x.id === concoctionId ? { ...x, doses: x.doses - 1 } : x)),
      log: [entry, ...s.log].slice(0, MAX_LOG)
    },
    outcome,
    effect
  };
}
