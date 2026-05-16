import Link from 'next/link';
import { CheckoutClient } from '@/components/CheckoutClient';
import { calculateQuote, isAvailable } from '@/lib/bookings';

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const checkIn = typeof params.checkIn === 'string' ? params.checkIn : '';
  const checkOut = typeof params.checkOut === 'string' ? params.checkOut : '';
  const guests = typeof params.guests === 'string' ? Number(params.guests) : 1;

  try {
    const quote = calculateQuote(checkIn, checkOut, guests);
    const available = await isAvailable(quote.checkIn, quote.checkOut);

    if (!available) {
      throw new Error('Valda datum är redan bokade.');
    }

    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <CheckoutClient
          quote={quote}
          paypalClientId={process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? ''}
          stripeEnabled={Boolean(process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('replace_me'))}
        />
      </main>
    );
  } catch (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white p-8 shadow-soft">
          <h1 className="text-3xl font-black text-slate-950">Kontrollera dina datum</h1>
          <p className="mt-3 text-slate-600">{(error as Error).message}</p>
          <Link href="/booking" className="mt-6 inline-flex rounded-full bg-coral px-6 py-3 font-bold text-white">
            Tillbaka till bokningen
          </Link>
        </div>
      </main>
    );
  }
}
