import type { ReactNode } from 'react';
import { CATEGORY_ICON, CATEGORY_ORDER } from '../lib/catalogue';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-5xl items-center px-4 py-8">
      <div className="grid w-full overflow-hidden rounded-3xl bg-surface shadow-card ring-1 ring-border md:grid-cols-2">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-on-primary md:flex">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sun/30" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-white/10" aria-hidden="true" />
          <div className="relative flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-xl font-black text-primary">P</span>
            <span className="text-2xl font-extrabold">PartnR</span>
          </div>
          <div className="relative">
            <h2 className="mb-3 text-3xl font-extrabold leading-tight">Sortez, rencontrez, partagez.</h2>
            <p className="text-base text-white/90">
              Un footing, un resto, une expo… Trouvez des gens près de chez vous pour ne plus rien faire seul.
            </p>
          </div>
          <div className="relative grid grid-cols-3 gap-2" aria-hidden="true">
            {CATEGORY_ORDER.map((c) => (
              <span key={c} className="flex flex-col items-center gap-1 rounded-2xl bg-white/15 px-2 py-3 text-sm font-bold">
                <span className="text-2xl">{CATEGORY_ICON[c]}</span>
                {c}
              </span>
            ))}
          </div>
        </div>
        <div className="p-6 sm:p-10">{children}</div>
      </div>
    </div>
  );
}
