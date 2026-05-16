import { NextResponse } from 'next/server';
import { createPendingBooking, updateBooking } from '@/lib/bookings';

function paypalBaseUrl() {
  return process.env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

async function getAccessToken() {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_CLIENT_ID === 'replace_me') {
    throw new Error('PayPal är inte konfigurerat. Lägg till PAYPAL_CLIENT_ID och PAYPAL_CLIENT_SECRET i .env.local.');
  }

  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) throw new Error('Kunde inte autentisera mot PayPal.');
  const data = await response.json();
  return data.access_token as string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const accessToken = await getAccessToken();
    const { booking, quote } = await createPendingBooking({ ...body, paymentProvider: 'paypal' });

    const response = await fetch(`${paypalBaseUrl()}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': booking.id
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            custom_id: booking.id,
            description: `Casa Vista Azul ${quote.checkIn}–${quote.checkOut}`,
            amount: {
              currency_code: 'EUR',
              value: quote.total.toFixed(2)
            }
          }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message ?? 'Kunde inte skapa PayPal-order.');

    await updateBooking(booking.id, { paypalOrderId: data.id });
    return NextResponse.json({ orderId: data.id, bookingId: booking.id });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
