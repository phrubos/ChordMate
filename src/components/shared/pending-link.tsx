'use client';

import type { ComponentProps } from 'react';
import Link, { useLinkStatus } from 'next/link';

/** Marks its link while the route loads; on a `.pressable` link the press tint stays and breathes (spec A24). */
function PendingMark() {
  const { pending } = useLinkStatus();
  return pending ? <span data-link-pending hidden /> : null;
}

/** `next/link` that shows it is loading the page it was tapped for. */
export function PendingLink({ children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link {...props}>
      {children}
      <PendingMark />
    </Link>
  );
}
