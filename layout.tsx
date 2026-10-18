import './globals.css';
import type { Metadata, Viewport } from 'next';
import Providers from '@/components/Providers';

export const metadata: Metadata = { title: 'Produksi & HSE', manifest: '/manifest.json' };
export const viewport: Viewport = { themeColor: '#f59e0b', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-white text-neutral-900 antialiased"><Providers>{children}</Providers></body>
    </html>
  );
}
