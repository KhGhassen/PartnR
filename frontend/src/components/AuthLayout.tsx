import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center px-4 py-10">
      <div className="grid w-full overflow-hidden rounded-3xl border border-line bg-white shadow-card md:grid-cols-2">
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-coral-500 to-violet-500 p-10 text-white md:flex">
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-base font-bold">
              P
            </span>
            <span className="text-xl font-bold">PartnR</span>
          </div>
          <div>
            <h2 className="mb-3 text-3xl font-bold leading-tight">
              Ne faites plus rien seul·e.
            </h2>
            <p className="text-sm leading-relaxed text-white/80">
              Course à pied, resto, concert, expo… Trouvez des partenaires près de chez vous
              pour toutes vos activités.
            </p>
          </div>
          <div className="flex gap-2 text-2xl">🏃 🍜 🎸 🎨 ⚽</div>
        </div>
        <div className="p-8 md:p-10">{children}</div>
      </div>
    </div>
  );
}
