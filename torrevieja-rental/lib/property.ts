export const property = {
  name: 'Casa Vista Azul',
  location: 'Torrevieja, Costa Blanca, Spanien',
  tagline: 'Rymligt semesterhus med pool, jacuzzi och takterrass nära Medelhavet.',
  maxGuests: 9,
  bedrooms: 3,
  beds: 7,
  bathrooms: 2.5,
  amenities: ['Privat pool', 'Jacuzzi', 'Takterrass', 'Snabbt Wi‑Fi', 'Fullt kök', 'Luftkonditionering', 'Tvättmaskin', 'Grillplats'],
  highlights: [
    'Plats för upp till 9 gäster med generösa sällskapsytor.',
    'Solig takterrass för frukost, kvällsdrinkar och havsbris.',
    'Perfekt läge för familjer som vill kombinera strand, pool och stadsliv.'
  ],
  description:
    'Välkommen till Casa Vista Azul – ett ljust och modernt semesterhus i Torrevieja med plats för hela familjen. Här finns tre sovrum, sju sängar, 2,5 badrum, privat pool, jacuzzi och en takterrass där du kan njuta av den spanska solen från morgon till kväll. Huset ligger nära stränder, restauranger, mataffärer och utflyktsmål längs Costa Blanca.',
  images: [
    {
      src: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=80',
      alt: 'Modernt semesterhus med pool'
    },
    {
      src: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      alt: 'Ljust sovrum med hotellkänsla'
    },
    {
      src: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80',
      alt: 'Öppet vardagsrum och kök'
    },
    {
      src: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
      alt: 'Takterrass med loungekänsla'
    }
  ]
};

export const seasonalPrices = {
  low: { label: 'Lågsäsong', price: 100, months: 'november–mars' },
  mid: { label: 'Mellansäsong', price: 125, months: 'april, maj, september och oktober' },
  high: { label: 'Högsäsong', price: 150, months: 'juni–augusti' }
} as const;

export const fees = {
  cleaning: 95,
  servicePercent: 0.08
};
