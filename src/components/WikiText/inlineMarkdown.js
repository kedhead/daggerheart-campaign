// The markdown AI-written text actually uses: **bold**, *italics* and
// "## headings". Session plan notes, summaries and generated descriptions
// came out with the asterisks showing, because WikiText only understood
// [[links]]. Lists, numbering and line breaks already read fine as plain
// text (WikiText keeps whitespace), so this stays deliberately small.
//
// Returns tokens: { type: 'text' | 'bold' | 'italic' | 'heading', content }.
// Each token's content may still hold [[links]]; WikiText renders those.

// No lookbehind: Safari before 16.4 rejects it, and a regex that fails to
// parse would take the whole page down on an older iPhone. The italic
// branch captures the character before the * instead (group 4).
const PATTERN = /^(#{1,4})[ \t]+([^\n]+)$|\*\*([^\n]+?)\*\*|(^|[^\w*])\*(?![\s*])([^*\n]*?[^\s*])\*(?![\w*])/gm;

export function inlineMarkdown(text) {
  const src = String(text ?? '');
  const tokens = [];
  let last = 0;
  for (const m of src.matchAll(PATTERN)) {
    let start = m.index;
    if (m[5] !== undefined) start += m[4].length; // keep the character before the *
    if (start > last) tokens.push({ type: 'text', content: src.slice(last, start) });
    if (m[1]) tokens.push({ type: 'heading', content: m[2].replace(/\s*#+\s*$/, '') });
    else if (m[3] !== undefined) tokens.push({ type: 'bold', content: m[3] });
    else tokens.push({ type: 'italic', content: m[5] });
    last = m.index + m[0].length;
  }
  if (last < src.length) tokens.push({ type: 'text', content: src.slice(last) });
  return tokens;
}
