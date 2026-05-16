import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

type CommonProps = {
  children: ReactNode;
  className?: string;
};

export function PrimaryLink({ children, className = '', ...props }: CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <Link
      {...props}
      className={`inline-flex items-center justify-center rounded-full bg-coral px-6 py-3 font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-rose-600 ${className}`}
    >
      {children}
    </Link>
  );
}

export function PrimaryButton({ children, className = '', ...props }: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-full bg-coral px-6 py-3 font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
