'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore when typing in inputs/textareas
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // Ctrl+N → new song
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        router.push('/songs/new');
        return;
      }

      // Navigate with number keys
      if (e.key === '1' && !e.ctrlKey && !e.metaKey) {
        if (pathname !== '/dashboard') router.push('/dashboard');
        return;
      }
      if (e.key === '2' && !e.ctrlKey && !e.metaKey) {
        if (pathname !== '/songs') router.push('/songs');
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, pathname]);

  return null;
}
