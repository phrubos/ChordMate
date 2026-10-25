'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NAV_ITEMS } from '@/components/layout/nav-items';

const GROUPS: { title: string; items: [keys: string[], label: string][] }[] = [
  {
    title: 'Bárhol',
    items: [
      [['Ctrl', 'K'], 'Keresés'],
      [['N'], 'Új dal'],
      ...NAV_ITEMS.map((item, i): [string[], string] => [[String(i + 1)], item.label]),
      [['?'], 'Ez a súgó'],
    ],
  },
  {
    title: 'Próba mód',
    items: [
      [['←', '→'], 'Előző / következő dal'],
      [['Szóköz'], 'Metronóm be / ki'],
      [['Esc'], 'Kilépés'],
    ],
  },
];

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/** App-wide shortcuts. Mounted in the (app) layout only, so Próba mód and the login page keep their keys. */
export function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || isTyping(e.target)) return;

      if (e.key === '?') {
        e.preventDefault();
        setHelpOpen((open) => !open);
        return;
      }
      // Leave keys alone while a dialog, sheet or menu has focus.
      if (document.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"]')) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        router.push('/songs/new');
        return;
      }
      const item = NAV_ITEMS[Number(e.key) - 1];
      if (item && !item.match(pathname)) router.push(item.href);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, pathname]);

  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Billentyűparancsok</DialogTitle>
          <DialogDescription>Szövegmezőben gépelés közben nem élnek.</DialogDescription>
        </DialogHeader>
        {GROUPS.map((group) => (
          <section key={group.title} className="flex flex-col gap-1.5">
            <h3 className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">{group.title}</h3>
            <dl className="flex flex-col">
              {group.items.map(([keys, label]) => (
                <div key={label} className="flex items-center justify-between gap-4 border-b border-border py-1.5 last:border-0">
                  <dt>{label}</dt>
                  <dd className="flex gap-1">
                    {keys.map((k) => (
                      <kbd key={k} className="rounded border border-border-strong px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                        {k}
                      </kbd>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </DialogContent>
    </Dialog>
  );
}
