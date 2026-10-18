'use client';
import { ReactNode, useEffect } from 'react';
import { AuthProvider } from '@/lib/auth';
import { startAutoSync } from '@/lib/sync';
import AppShell from './AppShell';

export default function Providers({ children }: { children: ReactNode }) {
  useEffect(() => { startAutoSync(); }, []);
  return <AuthProvider><AppShell>{children}</AppShell></AuthProvider>;
}
