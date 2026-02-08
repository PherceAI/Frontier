// Root Layout with Providers
import type { Metadata } from 'next';
import { Geist, Geist_Mono, Outfit } from 'next/font/google';
import './globals.css';
import { Providers } from '@/lib/providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Frontier - Hotel Operations',
  description: 'El segundo cerebro de operaciones hoteleras',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
