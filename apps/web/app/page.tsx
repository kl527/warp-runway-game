import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 relative z-10">
      <div className="flex items-center gap-2 font-brand text-[11px] uppercase tracking-[0.18em] text-white/60">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-warp-orange shadow-[0_0_8px_rgba(255,61,0,0.7)]" />
        <span>Warp</span>
        <span className="text-white/25">/</span>
        <span>Runway</span>
      </div>

      <div className="rounded-2xl bg-white/[0.015] shadow-card-w px-8 py-7 sm:px-12 sm:py-10 max-w-2xl w-full flex flex-col items-center gap-5">
        <pre className="font-mono text-warp-accent-7 text-[10px] sm:text-xs md:text-sm leading-tight">
{` ██╗    ██╗  █████╗  ██████╗  ██████╗
 ██║    ██║ ██╔══██╗ ██╔══██╗ ██╔══██╗
 ██║ █╗ ██║ ███████║ ██████╔╝ ██████╔╝
 ██║███╗██║ ██╔══██║ ██╔══██╗ ██╔═══╝
 ╚███╔███╔╝ ██║  ██║ ██║  ██║ ██║
  ╚══╝╚══╝  ╚═╝  ╚═╝ ╚═╝  ╚═╝ ╚═╝
            R U N W A Y   G A M E`}
        </pre>

        <p className="font-sans text-sm text-white/50 text-center max-w-md">
          Become a unicorn — or get fired by the board.
        </p>

        <Link
          href="/play"
          className="mt-1 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-warp-orange text-white text-base font-medium hover:bg-warp-orange-hover transition"
        >
          Enter the simulation
          <span aria-hidden className="text-white/80">→</span>
        </Link>

        <p className="font-mono text-[11px] text-white/35 mt-1">
          Desktop only · Arrow keys + Space
        </p>
      </div>
    </main>
  );
}
