'use client';

import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useState } from 'react';
import type { Quote } from '@/lib/types';
import { PrimaryButton } from './PrimaryButton';

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        style?: Record<string, string>;
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onError?: (error: unknown) => void;
      }) => { render: (selector: string) => void };
    };
  }
}

type CheckoutClientProps = {
  quote: Quote;
  paypalClientId: string;
  stripeEnabled: boolean;
};

export function CheckoutClient({ quote, paypalClientId, stripeEnabled }: CheckoutClientProps) {
  const router = useRouter();
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const paypalEnabled = Boolean(paypalClientId && paypalClientId !== 'replace_me');

  const payload = {
    checkIn: quote.checkIn,
    checkOut: quote.checkOut,
    guests: quote.guests,
    guestName,
    guestEmail
  };

  function validateGuest() {
    if (!guestName.trim() || !guestEmail.trim()) {
      setError('Fyll i namn och e-post innan du går vidare till betalning.');
      return false;
    }
    setError('');
    return true;
  }

  async function startStripeCheckout() {
    if (!validateGuest()) return;
    setLoading(true);

    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? 'Kunde inte starta Stripe Checkout.');
      setLoading(false);
      return;
    }

    window.location.href = data.url;
  }

  function renderPayPalButtons() {
    if (!window.paypal || !paypalEnabled) return;
    const container = document.getElementById('paypal-buttons');
    if (container) container.innerHTML = '';

    window.paypal
      .Buttons({
        style: { layout: 'vertical', shape: 'pill' },
        createOrder: async () => {
          if (!validateGuest()) throw new Error('Saknade gästdetaljer');
          const response = await fetch('/api/paypal/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error ?? 'Kunde inte skapa PayPal-order.');
          return data.orderId;
        },
        onApprove: async (data) => {
          const response = await fetch('/api/paypal/capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: data.orderID })
          });
          const result = await response.json();
          if (!response.ok) {
            setError(result.error ?? 'PayPal-betalningen kunde inte slutföras.');
            return;
          }
          router.push(`/confirmation?bookingId=${result.bookingId}`);
        },
        onError: () => setError('PayPal kunde inte startas. Kontrollera dina sandbox-nycklar.')
      })
      .render('#paypal-buttons');
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
      {paypalEnabled && (
        <Script
          src={`https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=EUR`}
          onLoad={renderPayPalButtons}
        />
      )}
      <section className="rounded-3xl bg-white p-6 shadow-soft sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-coral">Kassa</p>
        <h1 className="mt-2 text-4xl font-black text-slate-950">Slutför bokningen</h1>
        <p className="mt-3 text-slate-600">Betala tryggt med kort/Klarna via Stripe eller med PayPal Sandbox.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <label className="font-semibold text-slate-700">
            Namn
            <input
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-orange-100 bg-sand px-4 py-3 outline-none focus:border-coral"
              placeholder="För- och efternamn"
            />
          </label>
          <label className="font-semibold text-slate-700">
            E-post
            <input
              value={guestEmail}
              onChange={(event) => setGuestEmail(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-orange-100 bg-sand px-4 py-3 outline-none focus:border-coral"
              placeholder="namn@example.com"
              type="email"
            />
          </label>
        </div>

        {error && <p className="mt-5 rounded-2xl bg-red-50 p-4 font-semibold text-red-700">{error}</p>}

        <div className="mt-8 grid gap-4">
          <PrimaryButton disabled={!stripeEnabled || loading} onClick={startStripeCheckout} className="w-full">
            {stripeEnabled ? 'Betala med kort eller Klarna' : 'Stripe-nyckel saknas i .env.local'}
          </PrimaryButton>

          <div className="rounded-3xl border border-orange-100 p-4">
            {paypalEnabled ? (
              <div id="paypal-buttons" />
            ) : (
              <p className="text-center text-sm font-semibold text-slate-500">Lägg till NEXT_PUBLIC_PAYPAL_CLIENT_ID i .env.local för att visa PayPal-knappen.</p>
            )}
          </div>
        </div>
      </section>

      <aside className="h-fit rounded-3xl bg-white p-6 shadow-soft">
        <h2 className="text-2xl font-black text-slate-950">Prisöversikt</h2>
        <dl className="mt-5 space-y-3 text-slate-700">
          <div className="flex justify-between gap-4">
            <dt>{quote.nights} nätter · snitt {quote.averageNightlyRate} €/natt</dt>
            <dd>{quote.subtotal} €</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Städavgift</dt>
            <dd>{quote.cleaningFee} €</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Serviceavgift</dt>
            <dd>{quote.serviceFee} €</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-orange-100 pt-4 text-xl font-black text-slate-950">
            <dt>Totalt</dt>
            <dd>{quote.total} €</dd>
          </div>
        </dl>
        <div className="mt-6 rounded-2xl bg-sand p-4 text-sm text-slate-600">
          <p>
            {quote.checkIn} → {quote.checkOut}
          </p>
          <p>{quote.guests} gäster</p>
        </div>
      </aside>
    </div>
  );
}
