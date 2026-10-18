const COLORS = [
  ['page', 'bg-page'],
  ['background', 'bg-background'],
  ['card', 'bg-card'],
  ['muted', 'bg-muted'],
  ['foreground', 'bg-foreground'],
  ['muted-foreground', 'bg-muted-foreground'],
  ['faint', 'bg-faint'],
  ['primary', 'bg-primary'],
  ['primary-text', 'bg-primary-text'],
  ['border-strong', 'bg-border-strong'],
  ['destructive', 'bg-destructive'],
  ['status-learning', 'bg-status-learning'],
  ['status-ok', 'bg-status-ok'],
  ['status-ready', 'bg-status-ready'],
  ['done', 'bg-done'],
  ['fav', 'bg-fav'],
] as const;

const SAMPLE = 'Gyöngyhajú lány — Kispál és a Borz, ő ű';

export function TokensSection() {
  return (
    <section id="tokens" className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {COLORS.map(([name, cls]) => (
          <div key={name} className="flex flex-col gap-2">
            <div className={`h-14 rounded-md border border-border ${cls}`} />
            <span className="font-mono text-xs text-muted-foreground">{name}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <p className="display-soft font-display text-[64px] leading-none font-medium tracking-tight">
          Csütörtök, <em className="font-normal text-primary">okt. 22.</em>
        </p>
        <p className="display-soft font-display text-[60px] leading-none font-medium tracking-tight">Dalok</p>
        <p className="display-soft font-display text-[26px] font-medium">{SAMPLE}</p>
        <p className="display-soft font-display text-[21px] font-medium">{SAMPLE}</p>
        <p className="text-[15px]">{SAMPLE} — Hanken Grotesk törzsszöveg.</p>
        <p className="text-[13px] text-muted-foreground">{SAMPLE} — kicsi.</p>
        <p className="font-mono text-xs tracking-widest text-faint uppercase">Következő próba · 6 nap múlva</p>
        <p className="font-mono text-sm tabular-nums">Bm · 74 BPM · Capo 7 · 6:30</p>
      </div>
    </section>
  );
}
