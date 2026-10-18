import { Role } from './auth';
const ALL: Role[] = ['super_admin', 'project_manager', 'hse_officer', 'production_supervisor', 'field_worker'];
const PROD: Role[] = ['super_admin', 'project_manager', 'production_supervisor'];
export type NavItem = { href: string; label: string; roles: Role[] };
export const NAV: { group: string; items: NavItem[] }[] = [
  { group: 'Umum', items: [{ href: '/dashboard', label: 'Ringkasan', roles: ALL }] },
  { group: 'Produksi', items: [
    { href: '/produksi/planning', label: 'Planning harian', roles: PROD },
    { href: '/produksi/kanban', label: 'Proses pekerjaan', roles: ALL },
    { href: '/produksi/laporan-harian', label: 'Laporan harian', roles: PROD },
    { href: '/produksi/hour-meter', label: 'Hour-meter alat', roles: ALL },
    { href: '/produksi/laporan-visual', label: 'Laporan visual', roles: ALL },
    { href: '/produksi/kendala', label: 'Kendala lapangan', roles: ALL },
  ]},
  { group: 'HSE', items: [
    { href: '/hse/manpower', label: 'Man power & man-hours', roles: ['super_admin', 'project_manager', 'hse_officer'] },
    { href: '/hse/p2h', label: 'P2H', roles: ALL },
    { href: '/hse/ptw', label: 'Permit to Work', roles: ALL },
    { href: '/hse/inspeksi', label: 'Inspeksi alat bantu', roles: ['super_admin', 'hse_officer', 'production_supervisor', 'field_worker'] },
    { href: '/hse/nearmiss', label: 'Near miss', roles: ALL },
    { href: '/hse/video-ai', label: 'Video AI Vision', roles: ['super_admin', 'project_manager', 'hse_officer'] },
    { href: '/hse/asisten', label: 'Asisten HSE', roles: ['super_admin', 'project_manager', 'hse_officer', 'production_supervisor'] },
    { href: '/hse/dokumen', label: 'Dokumen', roles: ALL },
    { href: '/hse/video-ai', label: 'Video AI Vision', roles: ['super_admin', 'project_manager', 'hse_officer'] },
    { href: '/hse/ai-assistant', label: 'AI Assistant', roles: ['super_admin', 'project_manager', 'hse_officer', 'production_supervisor'] },
    { href: '/hse/dokumen', label: 'Dokumen', roles: ALL },
    { href: '/hse/capa', label: 'CAPA', roles: ['super_admin', 'project_manager', 'hse_officer', 'production_supervisor'] },
  ]},
  { group: 'Admin', items: [{ href: '/admin/pengguna', label: 'Pengguna & alat', roles: ['super_admin'] }] },
];
