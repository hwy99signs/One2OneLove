import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, UserRound } from 'lucide-react';

export default function AdminUserModeToggle() {
  const [mount, setMount] = useState(null);

  useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    if (!['/admin','/admin/','/analytics','/analytics/'].includes(path)) {
      setMount(null);
      return undefined;
    }

    let host = null;
    const attach = () => {
      if (host?.isConnected) return;
      const header = document.querySelector('main header');
      if (!header) return;
      const row = header.querySelector(':scope > div') || header.firstElementChild;
      if (!row) return;
      const actions = row.lastElementChild;
      if (!actions) return;

      const existing = actions.querySelector?.('[data-o2ol-admin-user-toggle="true"]');
      if (existing) {
        host = existing;
        setMount(host);
        return;
      }

      host = document.createElement('span');
      host.setAttribute('data-o2ol-admin-user-toggle', 'true');
      actions.insertBefore(host, actions.firstChild || null);
      setMount(host);
    };

    attach();
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (host?.isConnected) host.remove();
      setMount(null);
    };
  }, []);

  if (!mount) return null;

  return createPortal(
    <div className="inline-flex overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-1 shadow-sm" aria-label="Switch between user and admin views">
      <button
        type="button"
        onClick={() => window.location.assign('/Home')}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-600 transition hover:bg-white hover:text-slate-900"
        aria-label="Switch to User View"
      >
        <UserRound size={15}/><span className="hidden sm:inline">User</span>
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-bold text-white shadow-sm"
        aria-current="page"
        aria-label="Admin View active"
      >
        <ShieldCheck size={15}/><span className="hidden sm:inline">Admin</span>
      </button>
    </div>,
    mount,
  );
}
