import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, UserRound } from 'lucide-react';

const USER_VIEW_KEY = 'o2ol-admin-user-view';

function isAdminPath(path) {
  return ['/admin','/admin/','/analytics','/analytics/'].includes(path);
}

function isUserViewPath(path) {
  return !isAdminPath(path) && !['/adminaccess','/adminaccess/'].includes(path);
}

export default function AdminUserModeToggle() {
  const [mount, setMount] = useState(null);
  const [mode, setMode] = useState(null);

  useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    const adminPath = isAdminPath(path);
    let adminUserView = false;
    try {
      adminUserView = window.sessionStorage.getItem(USER_VIEW_KEY) === '1';
    } catch {}

    if (!adminPath && !(adminUserView && isUserViewPath(path))) {
      setMount(null);
      setMode(null);
      return undefined;
    }

    setMode(adminPath ? 'admin' : 'user');

    let host = null;
    const attach = () => {
      if (host?.isConnected) return;

      const header = adminPath
        ? document.querySelector('main header')
        : document.querySelector('header');
      if (!header) return;

      const row = adminPath
        ? (header.querySelector(':scope > div') || header.firstElementChild)
        : header.firstElementChild;
      if (!row) return;

      const existing = header.querySelector?.('[data-o2ol-admin-user-toggle="true"]');
      if (existing) {
        host = existing;
        setMount(host);
        return;
      }

      host = document.createElement('span');
      host.setAttribute('data-o2ol-admin-user-toggle', 'true');

      if (adminPath) {
        const actions = row.lastElementChild;
        if (!actions) return;
        actions.insertBefore(host, actions.firstChild || null);
      } else {
        host.className = 'shrink-0';
        row.insertBefore(host, row.lastElementChild || null);
      }

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

  if (!mount || !mode) return null;

  const goUser = () => {
    try { window.sessionStorage.setItem(USER_VIEW_KEY, '1'); } catch {}
    window.location.assign('/Home');
  };

  const goAdmin = () => {
    try { window.sessionStorage.removeItem(USER_VIEW_KEY); } catch {}
    window.location.assign('/Admin');
  };

  const userActive = mode === 'user';
  const adminActive = mode === 'admin';

  return createPortal(
    <div className="inline-flex overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-1 shadow-sm" aria-label="Switch between user and admin views">
      <button
        type="button"
        onClick={goUser}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-bold transition 2xl:px-3 2xl:text-sm ${userActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}
        aria-current={userActive ? 'page' : undefined}
        aria-label={userActive ? 'User View active' : 'Switch to User View'}
      >
        <UserRound size={15}/><span className="hidden sm:inline">User</span>
      </button>
      <button
        type="button"
        onClick={goAdmin}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-bold transition 2xl:px-3 2xl:text-sm ${adminActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}
        aria-current={adminActive ? 'page' : undefined}
        aria-label={adminActive ? 'Admin View active' : 'Switch to Admin View'}
      >
        <ShieldCheck size={15}/><span className="hidden sm:inline">Admin</span>
      </button>
    </div>,
    mount,
  );
}
