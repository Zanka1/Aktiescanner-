import { Suspense } from 'react';
import { ConfirmationClient } from '@/components/ConfirmationClient';

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<main className="p-10 text-center">Laddar bekräftelse…</main>}>
      <ConfirmationClient />
    </Suspense>
  );
}
