import { NextResponse } from 'next/server';
import { blockedDates, calculateQuote, isAvailable } from '@/lib/bookings';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const guests = Number(searchParams.get('guests') ?? 1);

  if (!checkIn || !checkOut) {
    return NextResponse.json({ blockedDates: await blockedDates() });
  }

  try {
    const quote = calculateQuote(checkIn, checkOut, guests);
    const available = await isAvailable(quote.checkIn, quote.checkOut);
    return NextResponse.json({ available, quote, blockedDates: await blockedDates() });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
