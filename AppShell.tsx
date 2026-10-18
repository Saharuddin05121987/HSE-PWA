'use client';
import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, ROLE_LABEL } from '@/lib/auth';
import { NAV } from '@/lib/rbac';
import { pendingCount } from '@/lib/offline-db';
import NotificationBell from './NotificationBell';

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const [queued, setQueued] = useState(0);

  useEffect(() => { if (!loading && !user && path !== '/login') router.replace('/login'); }, [loading, user, path, router]);
  useEffect(() => {
    const up = () => setOnline(navigator.onLine);
    up(); window.addEventListener('online', up); window.addEventListener('offline', up);
    const t = setInterval(() => pendingCount().then(setQueued), 4000);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', up); clearInterval(t); };
  }, []);
  useEffect(() => setOpen(false), [path]);

  if (path === '/login') return <>{children}</>;
  if (loading || !user) return <div className="flex h-screen items-center justify-center text-lg">Memuat…</div>;

  const role = profile?.role;
  const nav = (
    <nav className="flex flex-col gap-4 p-4">
      {NAV.map((g) => {
        const items = g.items.filter((i) => !role || i.roles.includes(role));
        if (!items.length) return null;
        return (
          <div key={g.group}>
            <p className="mb-1 px-3 text-sm font-bold text-neutral-500">{g.group}</p>
            {items.map((i) => (
              <Link key={i.href} href={i.href}
                className={`flex h-14 items-center rounded-lg px-3 text-base font-semibold ${path.startsWith(i.href) ? 'bg-amber-400' : 'hover:bg-neutral-100'}`}>
                {i.label}
              </Link>
            ))}
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen md:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 overflow-auto border-r bg-white md:block">
        <p className="p-4 text-xl font-bold">Produksi & HSE</p>{nav}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <aside className="absolute inset-y-0 left-0 w-72 overflow-auto bg-white" onClick={(e) => e.stopPropagation()}>
            <p className="p-4 text-xl font-bold">Produksi & HSE</p>{nav}
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-white px-3">
        <button onClick={() => setOpen(true)} aria-label="Buka menu" className="h-12 w-12 rounded-lg border-2 text-xl md:hidden">☰</button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{profile?.full_name ?? user.email}</p>
          <p className="text-xs text-neutral-600">{role ? ROLE_LABEL[role] : ''}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${online ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {online ? 'Online' : 'Offline'}{queued > 0 && ` · ${queued} antre`}
        </span>
        <NotificationBell />
        <button onClick={signOut} className="h-12 rounded-lg border-2 px-3 text-sm font-semibold">Keluar</button>
      </header>

      <div className="pb-24">{children}</div>
    </div>
  );
}
