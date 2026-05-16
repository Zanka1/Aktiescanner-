# Casa Vista Azul – semesterhus i Torrevieja

En komplett Next.js-app för att hyra ut ett semesterhus i Torrevieja, Spanien. Appen har Airbnb-inspirerad design, boendesida, bokningskalender med blockerade datum, säsongspriser och betalflöden för Stripe Checkout (kort + Klarna) samt PayPal Sandbox.

## Funktioner

- Startsida med stora bilder och tydlig **Boka nu**-knapp.
- Detaljsida för boendet: 3 sovrum, 7 sängar, 2,5 badrum, plats för 9 gäster, pool, jacuzzi och takterrass.
- Bokningskalender som visar blockerade datum från `data/bookings.json`.
- Automatisk prisberäkning:
  - Lågsäsong: 100 €/natt (november–mars)
  - Mellansäsong: 125 €/natt (april, maj, september, oktober)
  - Högsäsong: 150 €/natt (juni–augusti)
- Kassasida med Stripe Checkout för `card` och `klarna`.
- PayPal-order och capture via PayPal REST API.
- Bekräftelsesida som markerar bokningen som `confirmed` och blockerar datumen.

## Kom igång

```bash
cd torrevieja-rental
npm install
cp .env.example .env.local
npm run dev
```

Öppna sedan [http://localhost:3000](http://localhost:3000).

## Miljövariabler

Fyll i `.env.local` med testnycklar innan du testar betalningarna:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_ENV=sandbox
```

Stripe Checkout skapas i `app/api/stripe/checkout/route.ts` med betalningsmetoderna `card` och `klarna`. PayPal-order skapas i `app/api/paypal/orders/route.ts` och fångas i `app/api/paypal/capture/route.ts`.

## Bokningsdata

Appen använder en enkel JSON-fil som databas: `data/bookings.json`. Exempelbokningar är redan inlagda så att kalendern visar blockerade datum. I lokal utveckling skrivs nya bokningar tillbaka till samma fil.

> För produktion bör JSON-filen bytas mot exempelvis Prisma + PostgreSQL, och Stripe-webhooks bör användas som enda källa för slutgiltig betalstatus.

## Projektstruktur

```text
app/                  Next.js App Router-sidor och API routes
components/           Delade React-komponenter
lib/                  Prislogik, bokningslogik och typdefinitioner
data/bookings.json    Enkel JSON-databas med bokningar
.env.example          Exempel på nödvändiga API-nycklar
```

## Viktiga sidor

- `/` – startsida
- `/accommodation` – boendedetaljer
- `/booking` – kalender och gästantal
- `/checkout` – kassa och betalmetoder
- `/confirmation` – tack- och bekräftelsesida
