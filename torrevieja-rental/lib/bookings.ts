import { addDays, differenceInCalendarDays, eachDayOfInterval, format, isBefore, parseISO } from 'date-fns';
import { promises as fs } from 'fs';
import path from 'path';
import { fees, seasonalPrices } from './property';
import type { Booking, PaymentProvider, Quote } from './types';

const bookingsPath = path.join(process.cwd(), 'data', 'bookings.json');

export async function readBookings(): Promise<Booking[]> {
  try {
    const json = await fs.readFile(bookingsPath, 'utf8');
    return JSON.parse(json) as Booking[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await writeBookings([]);
      return [];
    }
    throw error;
  }
}

async function writeBookings(bookings: Booking[]) {
  await fs.mkdir(path.dirname(bookingsPath), { recursive: true });
  await fs.writeFile(bookingsPath, `${JSON.stringify(bookings, null, 2)}\n`, 'utf8');
}

export function normalizeDate(date: string) {
  return format(parseISO(date), 'yyyy-MM-dd');
}

export function getSeason(date: Date): 'low' | 'mid' | 'high' {
  const month = date.getMonth() + 1;
  if (month >= 6 && month <= 8) return 'high';
  if ([4, 5, 9, 10].includes(month)) return 'mid';
  return 'low';
}

export function nightlyRate(date: Date) {
  return seasonalPrices[getSeason(date)].price;
}

export function calculateQuote(checkIn: string, checkOut: string, guests: number): Quote {
  const start = parseISO(normalizeDate(checkIn));
  const end = parseISO(normalizeDate(checkOut));
  const nights = differenceInCalendarDays(end, start);

  if (!Number.isInteger(guests) || guests < 1 || guests > 9) {
    throw new Error('Antal gäster måste vara mellan 1 och 9.');
  }

  if (nights < 1) {
    throw new Error('Utcheckningsdatum måste vara efter incheckningsdatum.');
  }

  const breakdown = eachDayOfInterval({ start, end: addDays(end, -1) }).map((day) => {
    const season = getSeason(day);
    return {
      date: format(day, 'yyyy-MM-dd'),
      season,
      price: nightlyRate(day)
    };
  });

  const subtotal = breakdown.reduce((sum, night) => sum + night.price, 0);
  const cleaningFee = fees.cleaning;
  const serviceFee = Math.round(subtotal * fees.servicePercent);
  const total = subtotal + cleaningFee + serviceFee;

  return {
    checkIn: normalizeDate(checkIn),
    checkOut: normalizeDate(checkOut),
    guests,
    nights,
    subtotal,
    cleaningFee,
    serviceFee,
    total,
    currency: 'EUR',
    averageNightlyRate: Math.round(subtotal / nights),
    breakdown
  };
}

export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return isBefore(parseISO(aStart), parseISO(bEnd)) && isBefore(parseISO(bStart), parseISO(aEnd));
}

export async function isAvailable(checkIn: string, checkOut: string, ignoredBookingId?: string) {
  const bookings = await readBookings();
  return !bookings.some(
    (booking) =>
      booking.id !== ignoredBookingId &&
      booking.status !== 'cancelled' &&
      rangesOverlap(normalizeDate(checkIn), normalizeDate(checkOut), booking.checkIn, booking.checkOut)
  );
}

export async function blockedDates() {
  const bookings = await readBookings();
  const dates = new Set<string>();

  bookings
    .filter((booking) => booking.status !== 'cancelled')
    .forEach((booking) => {
      eachDayOfInterval({ start: parseISO(booking.checkIn), end: addDays(parseISO(booking.checkOut), -1) }).forEach((date) =>
        dates.add(format(date, 'yyyy-MM-dd'))
      );
    });

  return Array.from(dates).sort();
}

export async function createPendingBooking(input: {
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName: string;
  guestEmail: string;
  paymentProvider: PaymentProvider;
}) {
  const quote = calculateQuote(input.checkIn, input.checkOut, input.guests);
  const available = await isAvailable(quote.checkIn, quote.checkOut);

  if (!available) {
    throw new Error('Valda datum är inte längre tillgängliga. Välj en annan period.');
  }

  const booking: Booking = {
    id: crypto.randomUUID(),
    checkIn: quote.checkIn,
    checkOut: quote.checkOut,
    guests: quote.guests,
    guestName: input.guestName,
    guestEmail: input.guestEmail,
    status: 'pending',
    paymentProvider: input.paymentProvider,
    total: quote.total,
    createdAt: new Date().toISOString()
  };

  const bookings = await readBookings();
  bookings.push(booking);
  await writeBookings(bookings);
  return { booking, quote };
}

export async function updateBooking(id: string, patch: Partial<Booking>) {
  const bookings = await readBookings();
  const index = bookings.findIndex((booking) => booking.id === id);

  if (index === -1) {
    throw new Error('Bokningen kunde inte hittas.');
  }

  bookings[index] = { ...bookings[index], ...patch };
  await writeBookings(bookings);
  return bookings[index];
}

export async function findBooking(id: string) {
  const bookings = await readBookings();
  return bookings.find((booking) => booking.id === id) ?? null;
}
