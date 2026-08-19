// Composing a scene's image prompt.
//
// PURE — no Firebase, no fetch. Kept out of storybookGenerator so the smoke
// tests can exercise it (importing that module pulls in the Firebase config,
// which needs import.meta.env and can't load under node).
//
// A scene's stored prompt is what the AUTHOR wrote. The sentences below describe
// the CURRENT render — whether reference portraits were attached and who they
// show — so they are composed at call time and never persisted. Storing the
// composed text was the cause of two bugs: every Regenerate appended the clauses
// again, and a scene later regenerated WITHOUT references still carried the
// claim that "the characters in this scene are the people shown in the reference
// images". Told to depict people from references that were never sent, the image
// model invents them.

export const REFERENCE_CLAUSE = ' The characters in this scene are the people shown in the reference images — preserve their exact faces, species, clothing, and gear from the references.';

// Nothing else in the prompt stops the model populating a scene with extras, and
// generic invented bystanders were the usual result.
export const NO_EXTRAS_CLAUSE = ' Depict only the characters described above; do not add any other people to the scene.';

// Clauses are only ever appended to the END of a prompt, so everything from the
// earliest marker onward is machine-written and can be discarded to recover what
// the author actually wrote.
const APPENDED_CLAUSE_MARKERS = [
  'The characters in this scene are the people shown in the reference images',
  'Characters in this scene (render their species accurately):',
  'Depict only the characters described above;',
];

/** Recover the author's own prompt from one that may have clauses appended. */
export function stripAppendedClauses(prompt) {
  const text = String(prompt || '');
  let cut = -1;
  for (const marker of APPENDED_CLAUSE_MARKERS) {
    const i = text.indexOf(marker);
    if (i !== -1 && (cut === -1 || i < cut)) cut = i;
  }
  return (cut === -1 ? text : text.slice(0, cut)).trim();
}

/**
 * Build the prompt actually sent to the image model.
 *
 * @param {object} opts
 * @param {string} opts.prompt                - the scene's stored prompt (may carry old clauses)
 * @param {boolean} opts.hasReferenceImages   - whether portraits are attached to THIS call
 * @param {string[]} [opts.featuredDescriptions] - written descriptions, used when there are no references
 */
export function composeScenePrompt({ prompt, hasReferenceImages, featuredDescriptions = [] }) {
  const base = stripAppendedClauses(prompt);
  const featured = hasReferenceImages
    ? REFERENCE_CLAUSE
    : featuredDescriptions.length
      ? ` Characters in this scene (render their species accurately): ${featuredDescriptions.join('; ')}.`
      : '';
  return `${base}${featured}${NO_EXTRAS_CLAUSE}`;
}
