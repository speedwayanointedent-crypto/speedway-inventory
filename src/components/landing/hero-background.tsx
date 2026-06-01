export function HeroBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,theme(colors.primary/15),transparent_55%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.border/40)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.border/40)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/30 blur-3xl" />
      <div className="absolute top-40 right-10 h-56 w-56 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="absolute bottom-10 left-10 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />
    </div>
  );
}
