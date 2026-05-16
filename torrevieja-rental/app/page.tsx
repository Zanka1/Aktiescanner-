import Image from 'next/image';
import { PrimaryLink } from '@/components/PrimaryButton';
import { PropertyGallery } from '@/components/PropertyGallery';
import { property, seasonalPrices } from '@/lib/property';

export default function HomePage() {
  return (
    <main>
      <section className="relative min-h-[78vh] overflow-hidden">
        <Image src={property.images[0].src} alt={property.images[0].alt} fill priority className="object-cover" />
        <div className="hero-gradient absolute inset-0" />
        <div className="relative mx-auto flex min-h-[78vh] max-w-7xl items-end px-4 pb-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl text-white">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.35em] text-orange-100">Torrevieja · Costa Blanca</p>
            <h1 className="text-5xl font-black tracking-tight sm:text-7xl">{property.name}</h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-orange-50">{property.tagline}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <PrimaryLink href="/booking">Boka nu</PrimaryLink>
              <PrimaryLink href="/accommodation" className="bg-white text-slate-950 hover:bg-orange-50">
                Se boendet
              </PrimaryLink>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-4">
          {[
            ['Gäster', `${property.maxGuests}`],
            ['Sovrum', `${property.bedrooms}`],
            ['Sängar', `${property.beds}`],
            ['Badrum', `${property.bathrooms}`]
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl bg-white p-6 text-center shadow-soft">
              <p className="text-4xl font-black text-coral">{value}</p>
              <p className="mt-2 font-semibold text-slate-600">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <PropertyGallery />
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-coral">Enkel prissättning</p>
            <h2 className="mt-3 text-4xl font-black text-slate-950">Säsongspriser som räknas automatiskt.</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">Välj datum i kalendern, se totalpris direkt och fortsätt till kassan med kort, Klarna eller PayPal.</p>
          </div>
          <div className="grid gap-3">
            {Object.entries(seasonalPrices).map(([key, season]) => (
              <div key={key} className="rounded-3xl border border-orange-100 bg-sand p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-black text-slate-950">{season.label}</p>
                    <p className="text-sm text-slate-600">{season.months}</p>
                  </div>
                  <p className="text-2xl font-black text-coral">{season.price} €/natt</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
