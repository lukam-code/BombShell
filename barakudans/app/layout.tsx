import type { Metadata, Viewport } from 'next';
import { Inter, Syne } from 'next/font/google';
import { config } from '@/lib/config';
import './globals.css';

// Display: Syne (karakterna, "klupska" geometrija). Tekst: Inter (čitljiv na malim ekranima).
const display = Syne({ subsets: ['latin', 'latin-ext'], variable: '--font-display', display: 'swap' });
const body = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-body', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: { default: `${config.name} – bar, koktli i žurke | Rezerviši sto`, template: `%s | ${config.name}` },
  description: config.description,
  openGraph: {
    title: `${config.name} – ${config.tagline}`,
    description: config.description,
    type: 'website',
    locale: 'sr_RS',
    siteName: config.name,
  },
  twitter: { card: 'summary_large_image' },
  alternates: { canonical: '/' },
};

export const viewport: Viewport = { themeColor: '#07090d', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sr-Latn" className={`${display.variable} ${body.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
