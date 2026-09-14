import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminEntryTab() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [mount, setMount] = useState(null);
  const isAdmin = Boolean(isAuthenticated && user?.role === 'admin');

  useEffect(() => {
    if (isLoading || !isAdmin) {
      setMount(null);
      return undefined;
    }

    const path = window.location.pathname.toLowerCase();
    if (path === '/subscription' || path === '/subscription/') {
      window.location.replace('/Home');
      return undefined;
    }
    if (path === '/admin' || path === '/admin/' || path === '/analytics' || path === '/analytics/' || path === '/adminaccess' || path === '/adminaccess/') {
      setMount(null);
      return undefined;
    }

    let host = null;
    let currentNav = null;

    const attach = () => {
      if (host?.isConnected) return;
      const header = document.querySelector('header');
      if (!header) return;
      const navs = Array.from(header.querySelectorAll('nav'));
      const desktopNav = navs.find(nav => (nav.className || '').includes('lg:flex') && (nav.className || '').includes('items-center'));
      if (!desktopNav) return;

      currentNav = desktopNav;
      host = document.createElement('span');
      host.setAttribute('data-o2ol-admin-entry', 'true');
      const languageBlock = desktopNav.lastElementChild;
      if (languageBlock) desktopNav.insertBefore(host, languageBlock);
      else desktopNav.appendChild(host);
      setMount(host);
    };

    attach();
    const observer = new MutationObserver(attach);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (host?.isConnected) host.remove();
      if (currentNav?.isConnected) currentNav = null;
      setMount(null);
    };
  }, [isAdmin, isLoading]);

  if (!mount || !isAdmin) return null;

  return createPortal(
    <button
      type="button"
      onClick={() => window.location.assign('/AdminAccess')}
      className="inline-flex items-center gap-2 rounded-xl border border-white/35 bg-white/15 px-3 py-2 text-base font-bold text-white shadow-sm transition hover:bg-white/25 hover:text-yellow-100"
      aria-label="Open Admin"
    >
      <ShieldCheck size={18}/>Admin
    </button>,
    mount,
  );
}
