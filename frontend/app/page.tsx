import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-background text-foreground">
      <section className="relative isolate min-h-[calc(100vh-73px)] overflow-hidden">
        <div
          aria-hidden
          className="animate-hero-drift absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_20%_15%,rgba(59,130,246,0.28),transparent_45%),radial-gradient(ellipse_at_85%_70%,rgba(14,165,233,0.16),transparent_40%),linear-gradient(160deg,#0b1220_0%,#111827_48%,#0a1628_100%)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.18] [background-image:linear-gradient(rgba(148,163,184,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.18)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_78%)]"
        />
        <div
          aria-hidden
          className="animate-hero-scan pointer-events-none absolute inset-x-0 top-0 -z-10 h-1/3 bg-gradient-to-b from-transparent via-sky-300/10 to-transparent"
        />

        <div className="mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-6xl flex-col justify-center px-6 py-16 sm:px-8 lg:px-10">
          <p className="animate-hero-fade-up font-display text-5xl font-extrabold tracking-tight text-white sm:text-7xl md:text-8xl">
            PlayerFinder
          </p>

          <h1 className="animate-hero-fade-up-delay-1 mt-6 max-w-2xl font-display text-2xl font-semibold leading-tight tracking-tight text-slate-100 sm:text-4xl">
            Nézd meg, kivel ülsz le játszani.
          </h1>

          <p className="animate-hero-fade-up-delay-2 mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            Riot név alapján kereshetsz játékosokat, ranked adatokkal és
            közösségi értékeléssel — mielőtt elindul a queue.
          </p>

          <div className="animate-hero-fade-up-delay-3 mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center bg-accent px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-500 sm:text-base"
            >
              Regisztráció
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center border border-slate-500/70 px-7 py-3.5 text-sm font-semibold text-slate-100 transition hover:border-accent-soft hover:text-white sm:text-base"
            >
              Bejelentkezés
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800/80 px-6 py-20 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Keresés. Rank. Értékelés.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            Add meg a játékos Riot nevét és tagjét, nézd a ranked formát, majd
            értékeld a skillt, teamworket és a hangulatot — hogy a következő
            party jobb legyen.
          </p>
          <Link
            href="/dashboard"
            className="mt-8 inline-flex text-accent-soft transition hover:text-white"
          >
            Ugrás a keresőhöz →
          </Link>
        </div>
      </section>
    </div>
  );
}
