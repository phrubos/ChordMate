'use client';

import { useState } from 'react';
import { ExternalLink, FileText, ZoomIn, ZoomOut, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface TabViewerModalProps {
  songTitle: string;
  artist: string;
  tabContent?: string | null;
  tabUrl?: string | null;
  trigger?: React.ReactNode;
}

export function TabViewerModal({ songTitle, artist, tabContent, tabUrl, trigger }: TabViewerModalProps) {
  const [fontSize, setFontSize] = useState(15);
  const [copied, setCopied] = useState(false);

  const hasTab = !!tabContent;
  const searchUrl = `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(`${artist} ${songTitle}`)}`;

  function handleCopy() {
    if (tabContent) {
      navigator.clipboard.writeText(tabContent);
      setCopied(true);
      toast.success('Tab kimásolva');
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          trigger ? (
            trigger as React.ReactElement
          ) : (
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary" />
          )
        }
      >
        {!trigger && (
          <>
            <FileText className="size-4" />
            Tab
          </>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] sm:max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-lg">{songTitle}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">{artist}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-border/50 pb-3 shrink-0">
          <div className="flex items-center gap-1 rounded-lg bg-secondary/50 p-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="size-7 p-0"
              onClick={() => setFontSize(Math.max(10, fontSize - 1))}
            >
              <ZoomOut className="size-3.5" />
            </Button>
            <span className="min-w-[3ch] text-center text-xs text-muted-foreground">{fontSize}</span>
            <Button
              variant="ghost"
              size="sm"
              className="size-7 p-0"
              onClick={() => setFontSize(Math.min(20, fontSize + 1))}
            >
              <ZoomIn className="size-3.5" />
            </Button>
          </div>

          {hasTab && (
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleCopy}>
              {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
              {copied ? 'Másolva' : 'Másolás'}
            </Button>
          )}

          <div className="flex-1" />

          {tabUrl && (
            <a href={tabUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <ExternalLink className="size-3.5" />
                Forrás megnyitása
              </Button>
            </a>
          )}

          <a href={searchUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              Ultimate Guitar
            </Button>
          </a>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-auto rounded-lg bg-background/50 border border-border/30 p-4 min-h-[300px]">
          {hasTab ? (
            <pre
              className="tab-content"
              style={{ fontSize: `${fontSize}px` }}
            >
              {tabContent}
            </pre>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/5 ring-1 ring-primary/10">
                <FileText className="size-7 text-primary/40" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">Nincs mentett tab</p>
                <p className="mt-1 text-xs text-muted-foreground/60">
                  Keresd meg az Ultimate Guitar-on és illeszd be a dal szerkesztésénél
                </p>
              </div>
              <a href={searchUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="size-4" />
                  Keresés az Ultimate Guitar-on
                </Button>
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
