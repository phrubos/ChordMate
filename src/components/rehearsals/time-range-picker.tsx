'use client';

import { useId, type KeyboardEvent, type ReactNode } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { durationLabel, minutesBetween, shiftTime } from '@/lib/rehearsals';
import { cn } from '@/lib/utils';

const STEP = 15;
const DEFAULT_START = '19:00';
const START_PRESETS = ['17:00', '18:00', '19:00', '20:00'];
const DURATIONS = [60, 90, 120, 180];

export interface TimeRange {
  start: string;
  end: string;
}

interface TimeRangePickerProps extends TimeRange {
  onChange: (next: TimeRange) => void;
  error?: string;
}

/**
 * Start and end of a rehearsal without the native time input (which misbehaved in the mobile sheet): two
 * 15-minute steppers, start presets, and length chips that set the end. Moving the start keeps the length.
 */
export function TimeRangePicker({ start, end, onChange, error }: TimeRangePickerProps) {
  const labelId = useId();
  const errorId = useId();
  const length = start && end ? minutesBetween(start, end) : null;

  const setStart = (next: string) => {
    if (!end || !start) return onChange({ start: next, end });
    const moved = shiftTime(next, minutesBetween(start, end));
    // Near midnight the end cannot follow: keep the length, don't squash it.
    if (minutesBetween(next, moved) !== minutesBetween(start, end)) return;
    onChange({ start: next, end: moved });
  };
  const stepStart = (minutes: number) => setStart(start ? shiftTime(start, minutes) : DEFAULT_START);
  const stepEnd = (minutes: number) => {
    if (!start) return;
    const next = end ? shiftTime(end, minutes) : shiftTime(start, 120);
    if (minutesBetween(start, next) >= STEP) onChange({ start, end: next });
  };

  return (
    <div role="group" aria-labelledby={labelId} aria-describedby={error ? errorId : undefined} className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span id={labelId} className="text-sm leading-none font-medium">
          Időpont
        </span>
        {start && (
          <Button variant="link" size="xs" className="h-auto px-0 text-muted-foreground" onClick={() => onChange({ start: '', end: '' })}>
            Időpont nélkül
          </Button>
        )}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <TimeStepper label="Kezdés" value={start} invalid={false} onStep={stepStart} onClear={() => onChange({ start: '', end: '' })} />
        <span aria-hidden className="text-faint">
          –
        </span>
        <TimeStepper label="Vége" value={end} disabled={!start} invalid={!!error} onStep={stepEnd} onClear={() => onChange({ start, end: '' })} />
      </div>

      <ChipRow label="Gyors">
        {START_PRESETS.map((t) => (
          <Chip key={t} active={start === t} onClick={() => setStart(t)}>
            {t}
          </Chip>
        ))}
      </ChipRow>
      <ChipRow label="Hossz" hint={length !== null && !DURATIONS.includes(length) && length > 0 ? durationLabel(length) : undefined}>
        {DURATIONS.map((minutes) => (
          <Chip
            key={minutes}
            active={length === minutes}
            disabled={!start || minutesBetween(start, shiftTime(start, minutes)) !== minutes}
            onClick={() => onChange({ start, end: shiftTime(start, minutes) })}
          >
            {durationLabel(minutes)}
          </Chip>
        ))}
      </ChipRow>

      {error && (
        <p id={errorId} className="text-[13px] text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function TimeStepper({
  label,
  value,
  disabled = false,
  invalid,
  onStep,
  onClear,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  invalid: boolean;
  onStep: (minutes: number) => void;
  onClear: () => void;
}) {
  const keys: Record<string, () => void> = {
    ArrowUp: () => onStep(STEP),
    ArrowRight: () => onStep(STEP),
    ArrowDown: () => onStep(-STEP),
    ArrowLeft: () => onStep(-STEP),
    PageUp: () => onStep(60),
    PageDown: () => onStep(-60),
    Delete: onClear,
    Backspace: onClear,
  };
  const onKeyDown = (e: KeyboardEvent) => {
    const run = keys[e.key];
    if (!run || disabled) return;
    e.preventDefault();
    run();
  };
  const minutes = value ? minutesBetween('00:00', value) : undefined;

  return (
    <div
      className={cn(
        'flex h-16 min-w-0 items-center rounded-xl border bg-background/50 transition-[border-color,opacity] duration-(--dur-fade)',
        invalid ? 'border-destructive' : 'border-input',
        disabled && 'opacity-50'
      )}
    >
      <Button variant="ghost" size="icon-sm" className="ml-1 shrink-0" aria-label={`${label}: 15 perccel korábban`} disabled={disabled} onClick={() => onStep(-STEP)}>
        <Minus />
      </Button>
      <div
        role="spinbutton"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-disabled={disabled || undefined}
        aria-invalid={invalid || undefined}
        aria-valuemin={0}
        aria-valuemax={23 * 60 + 45}
        aria-valuenow={minutes}
        aria-valuetext={value || 'nincs megadva'}
        onKeyDown={onKeyDown}
        className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="text-[11px] leading-none text-muted-foreground">{label}</span>
        <span className={cn('display-soft font-display text-[22px] leading-none font-medium tabular-nums', !value && 'text-faint')}>{value || '––:––'}</span>
      </div>
      <Button variant="ghost" size="icon-sm" className="mr-1 shrink-0" aria-label={`${label}: 15 perccel később`} disabled={disabled} onClick={() => onStep(STEP)}>
        <Plus />
      </Button>
    </div>
  );
}

function ChipRow({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 shrink-0 font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">{label}</span>
      <div role="group" aria-label={label} className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {children}
        {/* A length no chip matches (e.g. 2,5 óra) shows as the selected chip would, but is not a button. */}
        {hint && (
          <span className="inline-flex h-8 items-center rounded-full border border-primary bg-primary/12 px-3 text-[13px] font-medium text-primary-text tabular-nums">
            {hint}
          </span>
        )}
      </div>
    </div>
  );
}

function Chip({ active, disabled, onClick, children }: { active: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'pressable h-8 rounded-full border px-3 text-[13px] font-medium tabular-nums transition-[transform,background-color,border-color,color] duration-(--dur-fade) outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40',
        active ? 'border-primary bg-primary/12 text-primary-text' : 'border-border-strong text-muted-foreground hover:border-foreground/40 hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}
