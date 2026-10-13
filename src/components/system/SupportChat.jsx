import { useEffect, useRef, useState } from 'react';
import { getAnalyticsVisitorId } from '@/lib/interactionAnalytics';

// O2OL Support Chat (owner-directed, 2026-10-12): fronted by Musey — the
// owner's agent — with his name and avatar on the panel at his direction.
// Open to members and guests; answers come from the support handbook via
// /api/support-chat/message, account questions escalate to the team.
// Support is always free.
const CONVERSATION_KEY = 'o2ol_support_chat_conversation';
// Preview gate (owner's standing rule: nothing goes out before he sees it).
// The panel stays hidden for everyone until the owner has tried it and
// gives the word. Enable on a device by visiting any page once with
// ?museysupport=1 (stored on that device); ?museysupport=0 hides it again.
// Removing this gate is the launch step.
const PREVIEW_KEY = 'o2ol_support_chat_preview';

function previewEnabled() {
  try {
    const param = new URLSearchParams(window.location.search).get('museysupport');
    if (param === '1') window.localStorage.setItem(PREVIEW_KEY, '1');
    if (param === '0') window.localStorage.removeItem(PREVIEW_KEY);
    return window.localStorage.getItem(PREVIEW_KEY) === '1';
  } catch {
    return false;
  }
}

const WELCOME =
  "Hi, I'm Musey — One2OneLove's AI support assistant. Ask me about Credit, games, Love Notes, prices, or how anything on the site works. If it's about your own account and I can't settle it here, I'll pass it straight to our team.";

export default function SupportChat() {
  const [enabled] = useState(previewEnabled);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }]);
  const [input, setInput] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, messages, sending]);

  if (!enabled) return null;

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setError('');
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setSending(true);
    try {
      const response = await fetch('/api/support-chat/message', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: text,
          visitorId: getAnalyticsVisitorId(),
          conversationId: window.localStorage.getItem(CONVERSATION_KEY) || undefined,
          email: email.trim() || undefined,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error?.message || 'Support chat is unavailable right now.');
      }
      if (payload.conversationId) {
        window.localStorage.setItem(CONVERSATION_KEY, payload.conversationId);
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: payload.reply }]);
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again, or email support@one2onelove.com.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div data-guest-allow style={{ position: 'fixed', right: 16, bottom: 0, zIndex: 1200, fontFamily: 'inherit' }}>
      {!open && (
        <button
          type="button"
          data-guest-allow
          onClick={() => setOpen(true)}
          aria-label="Open support chat with Musey"
          style={{
            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            background: '#7c1d3f', color: '#fff', border: '2px solid #d4af37', borderBottom: 'none',
            borderRadius: '16px 16px 0 0', padding: '8px 18px 10px 10px',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.35)', fontSize: 17, fontWeight: 700,
          }}
        >
          <img src="/support/musey-avatar.webp" alt="Musey" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
          Musey · Support
        </button>
      )}

      {open && (
        <div
          data-guest-allow
          role="dialog"
          aria-label="One2OneLove support chat"
          style={{
            width: 'min(400px, calc(100vw - 24px))', height: 'min(560px, calc(100vh - 32px))',
            marginBottom: 12,
            display: 'flex', flexDirection: 'column', background: '#fff', color: '#1c1220',
            borderRadius: 18, overflow: 'hidden', boxShadow: '0 18px 50px rgba(0,0,0,0.45)',
            border: '1px solid #e6d9de',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#7c1d3f', color: '#fff', padding: '12px 14px' }}>
            <img src="/support/musey-avatar.webp" alt="Musey" style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', border: '2px solid #d4af37' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.1 }}>Musey</div>
              <div style={{ fontSize: 14, opacity: 0.92 }}>One2OneLove Support · AI assistant</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close support chat"
              style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 26, lineHeight: 1, cursor: 'pointer', padding: 4 }}
            >
              ×
            </button>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', background: '#fdf7f9', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                  background: msg.role === 'user' ? '#7c1d3f' : '#fff',
                  color: msg.role === 'user' ? '#fff' : '#1c1220',
                  border: msg.role === 'user' ? 'none' : '1px solid #ecdfe5',
                  borderRadius: 14, padding: '10px 12px', fontSize: 16, lineHeight: 1.45,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}
              >
                {msg.content}
              </div>
            ))}
            {sending && (
              <div style={{ alignSelf: 'flex-start', background: '#fff', border: '1px solid #ecdfe5', borderRadius: 14, padding: '10px 12px', fontSize: 16 }}>
                Musey is typing…
              </div>
            )}
            {error && (
              <div style={{ alignSelf: 'stretch', background: '#fdecec', border: '1px solid #f2b8b8', borderRadius: 12, padding: '10px 12px', fontSize: 15 }}>
                {error}
              </div>
            )}
          </div>

          <div style={{ padding: '10px 12px', borderTop: '1px solid #eee', background: '#fff' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email for follow-up (optional)"
              aria-label="Email for follow-up (optional)"
              style={{ width: '100%', boxSizing: 'border-box', fontSize: 15, padding: '8px 10px', border: '1px solid #ddd', borderRadius: 10, marginBottom: 8 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
                placeholder="Type your question…"
                aria-label="Type your question"
                style={{ flex: 1, fontSize: 16, padding: '10px 12px', border: '1px solid #ddd', borderRadius: 10 }}
              />
              <button
                type="button"
                onClick={send}
                disabled={sending || !input.trim()}
                style={{
                  background: '#7c1d3f', color: '#fff', border: 'none', borderRadius: 10,
                  padding: '10px 18px', fontSize: 16, fontWeight: 700,
                  cursor: sending || !input.trim() ? 'default' : 'pointer', opacity: sending || !input.trim() ? 0.55 : 1,
                }}
              >
                Send
              </button>
            </div>
            <div style={{ fontSize: 13, color: '#6b5a63', marginTop: 8, lineHeight: 1.4 }}>
              Free support. Never share your password or any code sent to you — our team will never ask for those.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
