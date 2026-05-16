'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Booking } from '@/lib/types';

export function ConfirmationClient() {
  const searchParams = useSearchParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function confirmBooking() {
      const bookingId = searchParams.get('bookingId');
      const sessionId = searchParams.get('session_id');
      const response = await fetch('/api/bookings/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, sessionId })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Bokningen kunde inte bekräftas.');
        return;
      }
      setBooking(data.booking);
    }

    confirmBooking();
  }, [searchParams]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-white p-8 shadow-soft">
        {!booking && !error && (
          <>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-coral">Ett ögonblick</p>
            <h1 className="mt-3 text-4xl font-black text-slate-950">Bekräftar din bokning…</h1>
          </>
        )}

        {error && (
          <>
            <h1 className="text-4xl font-black text-slate-950">Något gick fel</h1>
            <p className="mt-4 text-slate-600">{error}</p>
          </>
        )}

        {booking && (
          <>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-coral">Tack!</p>
            <h1 className="mt-3 text-4xl font-black text-slate-950">Din bokning är bekräftad</h1>
            <p className="mt-4 text-lg text-slate-600">
              {booking.checkIn} → {booking.checkOut} · {booking.guests} gäster
            </p>
            <div className="mt-6 rounded-3xl bg-sand p-5 text-left text-sm text-slate-700">
              <p>
                <strong>Bokningsnummer:</strong> {booking.id}
              </p>
              <p>
                <strong>Gäst:</strong> {booking.guestName} ({booking.guestEmail})
              </p>
              <p>
                <strong>Total:</strong> {booking.total} €
              </p>
              <p>
                <strong>Betalning:</strong> {booking.paymentProvider}
              </p>
            </div>
          </>
        )}

        <Link href="/" className="mt-8 inline-flex rounded-full bg-coral px-6 py-3 font-bold text-white">
          Till startsidan
        </Link>
      </div>
    </main>
  );
}
