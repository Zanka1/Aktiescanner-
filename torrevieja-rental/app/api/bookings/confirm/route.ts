import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { findBooking, updateBooking } from '@/lib/bookings';

export async function POST(request: Request) {
  const { bookingId, sessionId } = await request.json();

  if (!bookingId && !sessionId) {
    return NextResponse.json({ error: 'bookingId eller sessionId krävs.' }, { status: 400 });
  }

  try {
    let resolvedBookingId = bookingId as string | undefined;

    if (sessionId && process.env.STRIPE_SECRET_KEY) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== 'paid') {
        return NextResponse.json({ error: 'Stripe-betalningen är inte markerad som betald ännu.' }, { status: 402 });
      }

      resolvedBookingId = session.metadata?.bookingId ?? resolvedBookingId;
    }

    let booking = resolvedBookingId ? await findBooking(resolvedBookingId) : null;

    if (!booking) {
      return NextResponse.json({ error: 'Bokningen kunde inte hittas.' }, { status: 404 });
    }

    if (booking.status !== 'confirmed') {
      booking = await updateBooking(booking.id, { status: 'confirmed' });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
