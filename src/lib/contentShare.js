// Owner request 2026-11-01: every note carries a small brand footer, and members can
// share by text, email or social media. Sharing opens the member's own apps (no
// O2OL-paid SMS or email), so it adds no cost.
export const CONTENT_FOOTER = "one2onelove 💕";
export const withContentFooter = (content) => `${String(content || "").trim()}\n\n${CONTENT_FOOTER}`;
export function fitForX(content, link) {
  // X counts any link as 23 characters; keep room for the footer and two line breaks.
  const room = 280 - 23 - 1 - CONTENT_FOOTER.length - 2;
  const body = String(content || "").trim();
  const cut = body.length > room ? body.slice(0, room - 1).trimEnd() + "…" : body;
  return `${cut}\n\n${CONTENT_FOOTER} ${link}`;
}
