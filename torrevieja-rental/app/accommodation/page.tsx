import { PrimaryLink } from '@/components/PrimaryButton';
import { PropertyGallery } from '@/components/PropertyGallery';
import { property } from '@/lib/property';

export default function AccommodationPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-coral">Boendet</p>
        <h1 className="mt-3 text-4xl font-black text-slate-950 sm:text-6xl">{property.name}</h1>
        <p className="mt-4 text-xl text-slate-600">{property.location}</p>
      </div>
      <PropertyGallery />

      <section className="grid gap-10 py-14 lg:grid-cols-[1fr_360px]">
        <article>
          <div className="mb-8 flex flex-wrap gap-3 text-sm font-bold text-slate-700">
            <span>{property.maxGuests} gäster</span>
            <span>·</span>
            <span>{property.bedrooms} sovrum</span>
            <span>·</span>
            <span>{property.beds} sängar</span>
            <span>·</span>
            <span>{property.bathrooms} badrum</span>
          </div>
          <p className="text-lg leading-8 text-slate-700">{property.description}</p>

          <h2 className="mt-12 text-3xl font-black text-slate-950">Det här gör huset speciellt</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {property.highlights.map((highlight) => (
              <div key={highlight} className="rounded-3xl bg-white p-5 shadow-soft">
                <p className="font-semibold leading-7 text-slate-700">{highlight}</p>
              </div>
            ))}
          </div>

          <h2 className="mt-12 text-3xl font-black text-slate-950">Bekvämligheter</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {property.amenities.map((amenity) => (
              <div key={amenity} className="rounded-2xl border border-orange-100 bg-white p-4 font-semibold text-slate-700">
                ✓ {amenity}
              </div>
            ))}
          </div>
        </article>

        <aside className="h-fit rounded-3xl bg-white p-6 shadow-soft">
          <p className="text-2xl font-black text-slate-950">Redo för solsemester?</p>
          <p className="mt-3 text-slate-600">Se lediga datum, jämför säsongspris och boka på några minuter.</p>
          <PrimaryLink href="/booking" className="mt-6 w-full">
            Boka nu
          </PrimaryLink>
        </aside>
      </section>
    </main>
  );
}
