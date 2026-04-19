"use client";

export function MobileBlock() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <pre className="text-amber-300 text-xs leading-tight mb-4">
        {String.raw`
   _____  ______  _____ _  _______ ____  ____
  |  __ \|  ____|/ ____| |/ /_   _/ __ \|  _ \
  | |  | | |__  | (___ | ' /  | || |  | | |_) |
  | |  | |  __|  \___ \|  <   | || |  | |  __/
  | |__| | |____ ____) | . \ _| || |__| | |
  |_____/|______|_____/|_|\_\_____\____/|_|
        `}
      </pre>
      <h1 className="text-xl font-bold text-slate-100 mb-2">
        Warp Runway is desktop only.
      </h1>
      <p className="text-slate-400 max-w-md">
        This is a keyboard-driven ASCII simulator. Come back on a laptop and
        bring arrow keys.
      </p>
    </main>
  );
}
