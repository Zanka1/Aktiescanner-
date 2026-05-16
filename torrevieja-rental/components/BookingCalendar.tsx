'use client';

import { addMonths, eachDayOfInterval, endOfMonth, format, isBefore, isSameDay, isWithinInterval, parseISO, startOfMonth } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useMemo, useState } from 'react';
import { fees, seasonalPrices } from '@/lib/property';
import { PrimaryButton } from './PrimaryButton';

type BookingCalendarProps = {
  initialBlockedDates: string[];
};

function toDateKey(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

export function BookingCalendar({ initialBlockedDates }: BookingCalendarProps) {
  const blocked = useMemo(() => new Set(initialBlockedDates), [initialBlockedDates]);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [error, setError] = useState('');

  const today = useMemo(() => new Date(), []);
  const months = [startOfMonth(today), startOfMonth(addMonths(today, 1))];

  const quote = useMemo(() => {
    if (!checkIn || !checkOut) return null;
    const start = parseISO(checkIn);
    const end = parseISO(checkOut);
    const nights = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / 86_400_000));
    if (nights < 1) return null;

    const nightlyPrices = eachDayOfInterval({ start, end: new Date(end.getTime() - 86_400_000) }).map((day) => {
      const month = day.getMonth() + 1;
      if (month >= 6 && month <= 8) return seasonalPrices.high.price;
      if ([4, 5, 9, 10].includes(month)) return seasonalPrices.mid.price;
      return seasonalPrices.low.price;
    });
    const subtotal = nightlyPrices.reduce((sum, price) => sum + price, 0);
    const serviceFee = Math.round(subtotal * fees.servicePercent);
    return { nights, subtotal, serviceFee, total: subtotal + serviceFee + fees.cleaning };
  }, [checkIn, checkOut]);

  function dayIsBlocked(day: Date) {
    return isBefore(day, new Date(format(today, 'yyyy-MM-dd'))) || blocked.has(toDateKey(day));
  }

  function rangeContainsBlocked(start: string, end: string) {
    if (!start || !end) return false;
    const days = eachDayOfInterval({ start: parseISO(start), end: parseISO(end) });
    return days.some((day) => blocked.has(toDateKey(day)));
  }

  function selectDay(day: Date) {
    const key = toDateKey(day);
    if (dayIsBlocked(day)) return;

    if (!checkIn || (checkIn && checkOut) || isBefore(day, parseISO(checkIn))) {
      setCheckIn(key);
      setCheckOut('');
      setError('');
      return;
    }

    if (key === checkIn) return;

    if (rangeContainsBlocked(checkIn, key)) {
      setError('Perioden innehåller redan bokade datum. Välj ett annat slutdatum.');
      return;
    }

    setCheckOut(key);
    setError('');
  }

  function submit() {
    if (!checkIn || !checkOut) {
      setError('Välj både incheckning och utcheckning.');
      return;
    }

    const params = new URLSearchParams({ checkIn, checkOut, guests: String(guests) });
    window.location.href = `/checkout?${params.toString()}`;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section className="rounded-3xl bg-white p-5 shadow-soft sm:p-8">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-coral">Välj datum</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">Bokningskalender</h1>
            <p className="mt-2 text-slate-600">Grå datum är blockerade av exempelbokningar eller tidigare val.</p>
          </div>
          <label className="text-sm font-semibold text-slate-700">
            Antal gäster
            <select
              value={guests}
              onChange={(event) => setGuests(Number(event.target.value))}
              className="mt-2 block w-full rounded-2xl border border-orange-100 bg-sand px-4 py-3"
            >
              {Array.from({ length: 9 }, (_, index) => index + 1).map((guestCount) => (
                <option key={guestCount} value={guestCount}>
                  {guestCount} {guestCount === 1 ? 'gäst' : 'gäster'}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {months.map((month) => {
            const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });

            return (
              <div key={month.toISOString()} className="rounded-3xl border border-orange-100 p-4">
                <h2 className="mb-4 text-center text-lg font-black capitalize text-slate-900">{format(month, 'MMMM yyyy', { locale: sv })}</h2>
                <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase text-slate-400">
                  {['M', 'T', 'O', 'T', 'F', 'L', 'S'].map((dayName) => (
                    <span key={dayName}>{dayName}</span>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-7 gap-2">
                  {Array.from({ length: (days[0].getDay() + 6) % 7 }).map((_, index) => (
                    <span key={`empty-${index}`} />
                  ))}
                  {days.map((day) => {
                    const key = toDateKey(day);
                    const selectedStart = checkIn && isSameDay(day, parseISO(checkIn));
                    const selectedEnd = checkOut && isSameDay(day, parseISO(checkOut));
                    const inRange = checkIn && checkOut && isWithinInterval(day, { start: parseISO(checkIn), end: parseISO(checkOut) });
                    const unavailable = dayIsBlocked(day);

                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={unavailable}
                        onClick={() => selectDay(day)}
                        className={`aspect-square rounded-2xl text-sm font-bold transition ${
                          unavailable
                            ? 'cursor-not-allowed bg-slate-100 text-slate-300 line-through'
                            : selectedStart || selectedEnd
                              ? 'bg-coral text-white shadow-soft'
                              : inRange
                                ? 'bg-rose-100 text-coral'
                                : 'bg-sand text-slate-700 hover:bg-orange-100'
                        }`}
                        aria-label={key}
                      >
                        {format(day, 'd')}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <aside className="h-fit rounded-3xl bg-white p-6 shadow-soft">
        <h2 className="text-2xl font-black text-slate-950">Din vistelse</h2>
        <div className="mt-5 grid gap-3 text-sm">
          <div className="rounded-2xl bg-sand p-4">
            <p className="font-bold text-slate-500">Incheckning</p>
            <p className="text-lg font-black text-slate-900">{checkIn || 'Välj datum'}</p>
          </div>
          <div className="rounded-2xl bg-sand p-4">
            <p className="font-bold text-slate-500">Utcheckning</p>
            <p className="text-lg font-black text-slate-900">{checkOut || 'Välj datum'}</p>
          </div>
          <div className="rounded-2xl bg-sand p-4">
            <p className="font-bold text-slate-500">Gäster</p>
            <p className="text-lg font-black text-slate-900">{guests}</p>
          </div>
        </div>
        {quote && (
          <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
            <div className="flex justify-between"><span>{quote.nights} nätter</span><strong>{quote.subtotal} €</strong></div>
            <div className="flex justify-between"><span>Städning</span><strong>{fees.cleaning} €</strong></div>
            <div className="flex justify-between"><span>Serviceavgift</span><strong>{quote.serviceFee} €</strong></div>
            <div className="mt-2 flex justify-between border-t border-emerald-200 pt-2 text-base"><span>Totalt</span><strong>{quote.total} €</strong></div>
          </div>
        )}
        {error && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        <PrimaryButton onClick={submit} className="mt-6 w-full">
          Fortsätt till kassan
        </PrimaryButton>
      </aside>
    </div>
  );
}
