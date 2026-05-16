export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type PaymentProvider = 'stripe' | 'paypal' | 'manual';

export type Booking = {
  id: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName: string;
  guestEmail: string;
  status: BookingStatus;
  paymentProvider: PaymentProvider;
  total: number;
  stripeSessionId?: string;
  paypalOrderId?: string;
  createdAt: string;
};

export type Quote = {
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  total: number;
  currency: 'EUR';
  averageNightlyRate: number;
  breakdown: Array<{
    date: string;
    season: 'low' | 'mid' | 'high';
    price: number;
  }>;
};
