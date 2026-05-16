import { NextResponse } from 'next/server';
import { readBookings, updateBooking } from '@/lib/bookings';

function paypalBaseUrl() {
  return process.env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

async function getAccessToken() {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal är inte konfigurerat.');
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
    const { orderId } = await request.json();
    if (!orderId) return NextResponse.json({ error: 'orderId krävs.' }, { status: 400 });

    const accessToken = await getAccessToken();
    const response = await fetch(`${paypalBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message ?? 'Kunde inte fånga PayPal-betalningen.');

    const bookings = await readBookings();
    const booking = bookings.find((item) => item.paypalOrderId === orderId);
    if (!booking) throw new Error('Bokningen kunde inte hittas för PayPal-ordern.');

    const confirmed = await updateBooking(booking.id, { status: 'confirmed' });
    return NextResponse.json({ bookingId: confirmed.id, booking: confirmed });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
