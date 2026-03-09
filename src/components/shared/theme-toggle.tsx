'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('chordmate-theme');
    if (saved === 'light') {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    }
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('chordmate-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('chordmate-theme', 'light');
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="size-8 p-0 text-muted-foreground"
      onClick={toggle}
      title={isDark ? 'Világos mód' : 'Sötét mód'}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
