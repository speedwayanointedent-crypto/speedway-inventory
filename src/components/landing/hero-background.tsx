export function HeroBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Radial gradient orbs */}
      <div className="absolute -top-40 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-primary/30 via-blue-500/20 to-purple-500/30 blur-3xl" />
      <div className="absolute -right-32 top-40 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-400/20 via-blue-500/10 to-transparent blur-3xl" />
      <div className="absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-gradient-to-tr from-purple-500/20 via-pink-500/10 to-transparent blur-3xl" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 70% 50% at 50% 0%, black 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 50% at 50% 0%, black 30%, transparent 80%)",
        }}
      />

      {/* Top fade */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
