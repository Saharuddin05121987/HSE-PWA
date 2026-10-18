'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAuth, ROLE_LABEL, Role } from '@/lib/auth';
import { supabase } from '@/lib/sync';

type U = { id: string; full_name: string; role: Role; project_id: string | null; email: string; active: boolean };
type P = { id: string; name: string };
const ROLES = Object.keys(ROLE_LABEL) as Role[];

export default function Page() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<U[]>([]);
  const [projects, setProjects] = useState<P[]>([]);
  const [f, setF] = useState({ email: '', password: '', full_name: '', role: 'field_worker' as Role, project_id: '' });
  const [pname, setPname] = useState('');
  const [eq, setEq] = useState({ code: '', name: '', type: 'heavy', project_id: '' });
  const [msg, setMsg] = useState('');

  const call = useCallback(async (method: string, body?: unknown) => {
    const { data: s } = await supabase.auth.getSession();
    const res = await fetch('/api/admin/users', { method, headers: { 'content-type': 'application/json', authorization: `Bearer ${s.session?.access_token}` }, body: body ? JSON.stringify(body) : undefined });
    const j = await res.json();
    if (!res.ok) { setMsg(j.error ?? 'Gagal'); return null; }
    setMsg(''); return j;
  }, []);
  const load = useCallback(async () => {
    const u = await call('GET'); if (u) setUsers(u);
    const { data } = await supabase.from('projects').select('id,name').order('name'); setProjects((data as P[]) ?? []);
  }, [call]);
  useEffect(() => { if (profile?.role === 'super_admin') load(); }, [profile, load]);

  if (profile && profile.role !== 'super_admin') return <main className="p-4 font-semibold">Halaman ini hanya untuk Super Admin.</main>;

  const input = 'h-14 w-full rounded-lg border-2 border-neutral-300 px-3 text-base';
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Pengguna, proyek, dan alat</h1>
      {msg && <p className="font-semibold text-red-700">{msg}</p>}

      <h2 className="text-lg font-bold">Pengguna</h2>
      {users.map((u) => (
        <div key={u.id} className={`rounded-xl border-2 p-3 ${u.active ? '' : 'bg-neutral-100 opacity-70'}`}>
          <p className="font-bold">{u.full_name} {!u.active && <span className="text-sm text-red-700">(nonaktif)</span>}</p>
          <p className="text-sm text-neutral-700">{u.email}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <select className="h-12 rounded-lg border-2 px-2" value={u.role} onChange={async (e) => { await call('PATCH', { id: u.id, role: e.target.value }); load(); }}>
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
            <select className="h-12 rounded-lg border-2 px-2" value={u.project_id ?? ''} onChange={async (e) => { await call('PATCH', { id: u.id, project_id: e.target.value }); load(); }}>
              <option value="">Tanpa proyek</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <button onClick={async () => { await call('PATCH', { id: u.id, active: !u.active }); load(); }} className="mt-2 h-12 w-full rounded-lg border-2 font-semibold">
            {u.active ? 'Nonaktifkan akun' : 'Aktifkan kembali'}</button>
        </div>
      ))}

      <section className="flex flex-col gap-2 rounded-xl border-2 border-dashed p-3">
        <p className="font-bold">Tambah pengguna</p>
        <input className={input} placeholder="Nama lengkap" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
        <input className={input} type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <input className={input} type="text" placeholder="Kata sandi awal (min. 8 karakter)" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <select className={input} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })}>{ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select>
        <select className={input} value={f.project_id} onChange={(e) => setF({ ...f, project_id: e.target.value })}>
          <option value="">Pilih proyek</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <button disabled={!f.email || f.password.length < 8 || !f.full_name} className="h-14 rounded-lg bg-amber-500 font-bold disabled:opacity-40"
          onClick={async () => { if (await call('POST', f)) { setF({ ...f, email: '', password: '', full_name: '' }); load(); } }}>Buat akun</button>
        <p className="text-xs text-neutral-600">Minta pengguna mengganti kata sandi setelah login pertama.</p>
      </section>

      <h2 className="text-lg font-bold">Proyek</h2>
      <div className="flex gap-2">
        <input className={input} placeholder="Nama proyek baru" value={pname} onChange={(e) => setPname(e.target.value)} />
        <button disabled={!pname} className="h-14 rounded-lg bg-amber-500 px-4 font-bold disabled:opacity-40"
          onClick={async () => { const { error } = await supabase.from('projects').insert({ name: pname }); setMsg(error?.message ?? ''); setPname(''); load(); }}>Tambah</button>
      </div>

      <h2 className="text-lg font-bold">Alat</h2>
      <section className="flex flex-col gap-2 rounded-xl border p-3">
        <input className={input} placeholder="Kode alat (mis. EX-01)" value={eq.code} onChange={(e) => setEq({ ...eq, code: e.target.value })} />
        <input className={input} placeholder="Nama alat" value={eq.name} onChange={(e) => setEq({ ...eq, name: e.target.value })} />
        <select className={input} value={eq.type} onChange={(e) => setEq({ ...eq, type: e.target.value })}>
          <option value="heavy">Alat berat</option><option value="light">Alat ringan</option><option value="electrical">Alat listrik</option><option value="hand_tool">Alat tangan</option></select>
        <select className={input} value={eq.project_id} onChange={(e) => setEq({ ...eq, project_id: e.target.value })}>
          <option value="">Pilih proyek</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <button disabled={!eq.code || !eq.name || !eq.project_id} className="h-14 rounded-lg bg-amber-500 font-bold disabled:opacity-40"
          onClick={async () => { const { error } = await supabase.from('equipment').insert(eq); setMsg(error?.message ?? ''); if (!error) setEq({ ...eq, code: '', name: '' }); }}>Tambah alat</button>
      </section>
    </main>
  );
}
