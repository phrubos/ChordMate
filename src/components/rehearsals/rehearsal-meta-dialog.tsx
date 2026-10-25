'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SegmentedControl } from '@/components/design/segmented-control';
import { ResponsiveDialog } from '@/components/calendar/responsive-dialog';
import { saveRehearsalMeta } from '@/actions/rehearsals';
import { clearSongsFromDate } from '@/actions/calendar';
import { rehearsalMetaSchema } from '@/lib/validators';
import type { Rehearsal, RehearsalKind } from '@/types';
import { TimeRangePicker } from './time-range-picker';

interface RehearsalMetaDialogProps {
  date: string;
  meta: Rehearsal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Dev showcase: no server calls. */
  preview?: boolean;
}

type Field = 'startTime' | 'endTime' | 'place' | 'goal' | 'notes';

export function RehearsalMetaDialog({ date, meta, open, onOpenChange, preview }: RehearsalMetaDialogProps) {
  const router = useRouter();
  const [saving, startSave] = useTransition();
  const [removing, startRemove] = useTransition();
  const [kind, setKind] = useState<RehearsalKind>(meta?.kind ?? 'rehearsal');
  const [values, setValues] = useState<Record<Field, string>>({
    startTime: meta?.startTime ?? '',
    endTime: meta?.endTime ?? '',
    place: meta?.place ?? '',
    goal: meta?.goal ?? '',
    notes: meta?.notes ?? '',
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = (field: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((v) => ({ ...v, [field]: e.target.value }));

  function save() {
    const input = { kind, ...values };
    const parsed = rehearsalMetaSchema.safeParse(input);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    setErrors({});
    if (preview) return onOpenChange(false);
    startSave(async () => {
      try {
        await saveRehearsalMeta(date, input);
        toast.success('Próba mentve');
        onOpenChange(false);
        router.refresh();
      } catch {
        toast.error('Nem sikerült menteni');
      }
    });
  }

  function remove() {
    if (!confirmDelete) return setConfirmDelete(true);
    if (preview) return onOpenChange(false);
    startRemove(async () => {
      try {
        await clearSongsFromDate(date);
        toast.success('Próba törölve');
        router.push('/rehearsals');
      } catch {
        toast.error('Nem sikerült törölni');
      }
    });
  }

  const error = (field: Field) => errors[field] && <p className="text-[13px] text-destructive">{errors[field]}</p>;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title="Próba részletei">
      <div className="flex flex-col gap-4 overflow-y-auto">
        <SegmentedControl<RehearsalKind>
          ariaLabel="Típus"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'rehearsal', label: 'Próba' },
            { value: 'gig', label: 'Fellépés' },
          ]}
        />
        <TimeRangePicker
          start={values.startTime}
          end={values.endTime}
          onChange={({ start, end }) => {
            setValues((v) => ({ ...v, startTime: start, endTime: end }));
            setErrors((e) => ({ ...e, startTime: undefined, endTime: undefined }));
          }}
          error={errors.startTime ?? errors.endTime}
        />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rh-place">Helyszín</Label>
          <Input id="rh-place" value={values.place} onChange={set('place')} placeholder="pl. Próbaterem, Szeged" aria-invalid={!!errors.place} />
          {error('place')}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rh-goal">Cél</Label>
          <Input id="rh-goal" value={values.goal} onChange={set('goal')} placeholder="pl. Az új dalok átvétele" aria-invalid={!!errors.goal} />
          {error('goal')}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rh-notes">Jegyzet</Label>
          <Textarea id="rh-notes" rows={3} value={values.notes} onChange={set('notes')} aria-invalid={!!errors.notes} />
          {error('notes')}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Button variant="ghost" size="sm" className="text-destructive" isLoading={removing} disabled={saving} onClick={remove}>
          <Trash2 />
          {confirmDelete ? 'Biztosan törlöd?' : 'Próba törlése'}
        </Button>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Mégse
          </Button>
          <Button isLoading={saving} disabled={removing} onClick={save}>
            Mentés
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
