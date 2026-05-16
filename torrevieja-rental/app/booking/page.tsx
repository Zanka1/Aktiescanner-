import { BookingCalendar } from '@/components/BookingCalendar';
import { blockedDates } from '@/lib/bookings';
import { seasonalPrices } from '@/lib/property';

export default async function BookingPage() {
  const blocked = await blockedDates();

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <BookingCalendar initialBlockedDates={blocked} />
      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {Object.entries(seasonalPrices).map(([key, season]) => (
          <div key={key} className="rounded-3xl bg-white p-5 shadow-soft">
            <p className="font-black text-slate-950">{season.label}</p>
            <p className="mt-1 text-sm text-slate-600">{season.months}</p>
            <p className="mt-4 text-3xl font-black text-coral">{season.price} €</p>
            <p className="text-sm text-slate-500">per natt</p>
          </div>
        ))}
      </section>
    </main>
  );
}
