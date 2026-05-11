/**
 * Root Layout — BiteBlast
 */
import type { Metadata } from 'next';
import '@/styles/tokens.css';

export const metadata: Metadata = {
  title: 'BiteBlast — The Trusted Food Delivery Platform',
  description: 'A trust-first food delivery platform for India. Generated from Obsidian vault.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
