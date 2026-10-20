'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'chordmate-theme';

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}

const getIsDark = () => document.documentElement.classList.contains('dark');

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getIsDark, () => true);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === 'light') document.documentElement.classList.remove('dark');
  }, []);

  function toggle() {
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
  }

  const label = isDark ? 'Világos mód' : 'Sötét mód';
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:text-foreground"
      onClick={toggle}
      title={label}
      aria-label={label}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
