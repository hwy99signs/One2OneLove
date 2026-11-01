// AI Content Creator length template (owner-approved 2026-11-01).
// Measured from the owner's reference Amora note, rounded UP to the nearest 10:
//   short  = longest single paragraph (377)            -> 380 characters
//   medium = two longest paragraphs combined (699)     -> 700 characters
//   long   = the whole note incl. greeting/sign-off (1,067) -> 1,070 characters
// Love notes sent by text keep their own 171-character limit (AIPersonalizationModal).
export const CONTENT_LENGTH_RULES = Object.freeze({
  short: Object.freeze({ maxChars: 380, minChars: 300, shape: 'one paragraph, with no separate greeting or sign-off line' }),
  medium: Object.freeze({ maxChars: 700, minChars: 580, shape: 'two paragraphs, with no separate greeting or sign-off line' }),
  long: Object.freeze({ maxChars: 1070, minChars: 900, shape: 'a short greeting line, three paragraphs, and a short sign-off line' }),
});

export function contentLengthRule(length) {
  return CONTENT_LENGTH_RULES[String(length || '').toLowerCase()] || CONTENT_LENGTH_RULES.medium;
}

export function contentLengthPrompt(length) {
  const rule = contentLengthRule(length);
  return `Length: between ${rule.minChars} and ${rule.maxChars} characters in total, counting spaces and line breaks. Never exceed ${rule.maxChars} characters. Structure: ${rule.shape}.`;
}

// Safety net: if the model runs long, end at the last complete sentence that fits.
export function fitContentLength(text, length) {
  const max = contentLengthRule(length).maxChars;
  const clean = String(text || '').trim();
  if (clean.length <= max) return clean;
  const head = clean.slice(0, max);
  let cut = -1;
  const re = /[.!?…](?=["'”’)\]]?(\s|$))["'”’)\]]?/g;
  let m;
  while ((m = re.exec(head))) cut = m.index + m[0].length;
  if (cut >= Math.floor(max * 0.6)) return head.slice(0, cut).trim();
  const space = head.lastIndexOf(' ');
  return `${head.slice(0, space > 0 ? space : max - 1).trimEnd()}…`;
}
