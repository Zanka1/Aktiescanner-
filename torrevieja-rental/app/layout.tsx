import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Casa Vista Azul | Semesterhus i Torrevieja',
  description: 'Hyr ett modernt semesterhus med pool, jacuzzi och takterrass i Torrevieja, Spanien.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sv">
      <body className="min-h-screen font-sans antialiased">
        <header className="sticky top-0 z-50 border-b border-white/70 bg-white/90 backdrop-blur">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/" className="text-xl font-black tracking-tight text-coral">
              Casa Vista Azul
            </Link>
            <div className="flex items-center gap-4 text-sm font-semibold text-slate-700">
              <Link href="/accommodation" className="hover:text-coral">
                Boendet
              </Link>
              <Link href="/booking" className="rounded-full bg-coral px-5 py-2 text-white shadow-soft hover:bg-rose-600">
                Boka nu
              </Link>
            </div>
          </nav>
        </header>
        {children}
        <footer className="border-t border-orange-100 bg-white py-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 text-sm text-slate-600 sm:px-6 lg:px-8">
            <p className="font-semibold text-slate-900">Casa Vista Azul · Torrevieja</p>
            <p>Demo för bokningsflöde med Next.js, Stripe Checkout och PayPal Sandbox.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
