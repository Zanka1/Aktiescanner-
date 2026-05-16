import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createPendingBooking, updateBooking } from '@/lib/bookings';

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('replace_me')) {
    return NextResponse.json({ error: 'Stripe är inte konfigurerat. Lägg till STRIPE_SECRET_KEY i .env.local.' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { booking, quote } = await createPendingBooking({ ...body, paymentProvider: 'stripe' });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'klarna'],
      customer_email: booking.guestEmail,
      locale: 'sv',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'eur',
            unit_amount: quote.total * 100,
            product_data: {
              name: `Casa Vista Azul: ${quote.checkIn}–${quote.checkOut}`,
              description: `${quote.nights} nätter för ${quote.guests} gäster inklusive städ- och serviceavgift.`
            }
          }
        }
      ],
      metadata: { bookingId: booking.id },
      success_url: `${siteUrl}/confirmation?bookingId=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout?checkIn=${quote.checkIn}&checkOut=${quote.checkOut}&guests=${quote.guests}`
    });

    await updateBooking(booking.id, { stripeSessionId: session.id });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
