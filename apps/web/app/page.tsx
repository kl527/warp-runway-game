import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <pre className="text-emerald-400 text-[10px] sm:text-xs md:text-sm leading-none tracking-tight">
{` ██╗    ██╗  █████╗  ██████╗  ██████╗
 ██║    ██║ ██╔══██╗ ██╔══██╗ ██╔══██╗
 ██║ █╗ ██║ ███████║ ██████╔╝ ██████╔╝
 ██║███╗██║ ██╔══██║ ██╔══██╗ ██╔═══╝
 ╚███╔███╔╝ ██║  ██║ ██║  ██║ ██║
  ╚══╝╚══╝  ╚═╝  ╚═╝ ╚═╝  ╚═╝ ╚═╝
            R U N W A Y   G A M E`}
      </pre>
      <p className="max-w-xl text-center text-slate-400">
        Runway burning, VCs calling, coffee machine beckoning.
      </p>
      <Link
        href="/play"
        className="px-6 py-3 rounded bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition"
      >
        ENTER THE SIMULATION &gt;
      </Link>
      <p className="text-xs text-slate-600">Desktop only. Arrow keys + Space.</p>
    </main>
  );
}
