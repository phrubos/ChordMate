'use client';

import { Masthead } from '@/components/layout/masthead';
import { MobileTopBar } from '@/components/layout/mobile-top-bar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { ToolsLauncher } from '@/components/layout/tools-launcher';

const user = { name: 'Kiss Péter', image: null, email: 'peter@example.com' };

export function ShellSection() {
  return (
    <section id="shell" className="-mx-4 flex flex-col gap-4 lg:-mx-10">
      <ToolsLauncher>
        <Masthead user={user} />
        <MobileTopBar user={user} />
        <BottomNav />
      </ToolsLauncher>
    </section>
  );
}
