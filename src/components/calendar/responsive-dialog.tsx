'use client';

import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useIsDesktop } from '@/hooks/use-is-desktop';

interface ResponsiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  /** A line under the title (the Sheet and the Dialog share Base UI's Description). */
  description?: ReactNode;
  children: ReactNode;
}

/** Centered dialog on desktop, bottom sheet on mobile. */
export function ResponsiveDialog({ open, onOpenChange, title, description, children }: ResponsiveDialogProps) {
  const isDesktop = useIsDesktop();
  const desc = description && <DialogDescription className="-mt-3 truncate">{description}</DialogDescription>;
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[85vh] flex-col gap-4 bg-card p-5 sm:max-w-md">
          <DialogTitle className="display-soft font-display text-xl font-medium">{title}</DialogTitle>
          {desc}
          {children}
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetTitle>{title}</SheetTitle>
        {desc}
        {children}
      </SheetContent>
    </Sheet>
  );
}
