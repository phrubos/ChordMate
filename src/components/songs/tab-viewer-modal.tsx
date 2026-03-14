'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ExternalLink, FileText, ZoomIn, ZoomOut, Copy, Check, Play, Pause, Minus, Plus, RotateCcw } from 'lucide-react';
import { ChordTooltip } from '@/components/shared/chord-tooltip';
import { chordNames } from '@/lib/chord-diagrams';
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

// Build regex from known chord names (longest first to match "Cadd9" before "C")
const chordPattern = new RegExp(
  `(?<=^|\\s)(${chordNames.map((c) => c.replace(/[#/]/g, '\\$&')).join('|')})(?=\\s|$)`,
  'gm'
);

function TabContentWithChords({ content }: { content: string }) {
  const parts = useMemo(() => {
    const result: { text: string; isChord: boolean; chord?: string }[] = [];
    const lines = content.split('\n');

    for (let li = 0; li < lines.length; li++) {
      const line = lines[li];
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      const lineRegex = new RegExp(chordPattern.source, chordPattern.flags);

      while ((match = lineRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          result.push({ text: line.slice(lastIndex, match.index), isChord: false });
        }
        result.push({ text: match[1], isChord: true, chord: match[1] });
        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < line.length) {
        result.push({ text: line.slice(lastIndex), isChord: false });
      }

      if (li < lines.length - 1) {
        result.push({ text: '\n', isChord: false });
      }
    }

    return result;
  }, [content]);

  return (
    <>
      {parts.map((part, i) =>
        part.isChord && part.chord ? (
          <ChordTooltip key={i} chordName={part.chord}>
            <span className="text-primary font-semibold cursor-help underline decoration-primary/30 decoration-dotted underline-offset-2">
              {part.text}
            </span>
          </ChordTooltip>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </>
  );
}

const BASE_PX_PER_SEC = 5;
const DEFAULT_SPEED = 1;

export function TabViewerModal({ songTitle, artist, tabContent, tabUrl, trigger }: TabViewerModalProps) {
  const [fontSize, setFontSize] = useState(15);
  const [copied, setCopied] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(DEFAULT_SPEED);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const scrollAccumRef = useRef<number>(0);
  const speedRef = useRef(DEFAULT_SPEED);

  // Keep speedRef in sync so the rAF loop always reads the latest value
  useEffect(() => {
    speedRef.current = scrollSpeed;
  }, [scrollSpeed]);

  const stopAutoScroll = useCallback(() => {
    setIsAutoScrolling(false);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  const startAutoScroll = useCallback(() => {
    scrollAccumRef.current = 0;
    lastTimeRef.current = 0;
    setIsAutoScrolling(true);
  }, []);

  useEffect(() => {
    if (!isAutoScrolling) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    function tick(timestamp: number) {
      if (!container) return;
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }
      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Accumulate fractional pixels to avoid sub-pixel rounding to 0
      scrollAccumRef.current += (speedRef.current * BASE_PX_PER_SEC * delta) / 1000;

      const px = Math.floor(scrollAccumRef.current);
      if (px >= 1) {
        container.scrollTop += px;
        scrollAccumRef.current -= px;
      }

      // Stop if reached the bottom
      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 1) {
        stopAutoScroll();
        return;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    }

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isAutoScrolling, stopAutoScroll]);

  // Stop auto-scroll on dialog close
  useEffect(() => {
    return () => stopAutoScroll();
  }, [stopAutoScroll]);

  function handleResetScroll() {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTop = 0;
    }
  }

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
      <DialogContent className="max-w-[90vw] sm:max-w-5xl max-h-[90vh] landscape:max-h-[95vh] landscape:max-w-[95vw] flex flex-col">
        <DialogHeader className="shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-lg landscape:text-sm">{songTitle}</DialogTitle>
              <p className="text-sm landscape:text-xs text-muted-foreground mt-0.5 landscape:mt-0">{artist}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 landscape:gap-1 border-b border-border/50 pb-3 landscape:pb-1.5 shrink-0">
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
              <span className="hidden sm:inline">{copied ? 'Másolva' : 'Másolás'}</span>
            </Button>
          )}

          {/* Auto-scroll controls */}
          {hasTab && (
            <div className="flex items-center gap-1.5 rounded-lg bg-secondary/50 p-0.5 px-1">
              <Button
                variant="ghost"
                size="sm"
                className={`size-7 p-0 ${isAutoScrolling ? 'text-primary bg-primary/10' : ''}`}
                onClick={() => isAutoScrolling ? stopAutoScroll() : startAutoScroll()}
                title={isAutoScrolling ? 'Görgetés megállítása' : 'Auto-görgetés indítása'}
              >
                {isAutoScrolling ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              </Button>
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-6 p-0"
                  onClick={() => setScrollSpeed((s) => Math.max(0.5, +(s - 0.5).toFixed(1)))}
                  disabled={scrollSpeed <= 0.5}
                >
                  <Minus className="size-3" />
                </Button>
                <span className="min-w-[3.5ch] text-center text-xs text-muted-foreground tabular-nums">{scrollSpeed}x</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-6 p-0"
                  onClick={() => setScrollSpeed((s) => Math.min(3, +(s + 0.5).toFixed(1)))}
                  disabled={scrollSpeed >= 3}
                >
                  <Plus className="size-3" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="size-6 p-0 text-muted-foreground"
                onClick={handleResetScroll}
                title="Vissza az elejére"
              >
                <RotateCcw className="size-3" />
              </Button>
            </div>
          )}

          <div className="flex-1" />

          {tabUrl && (
            <a href={tabUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <ExternalLink className="size-3.5" />
                <span className="hidden sm:inline">Forrás megnyitása</span>
              </Button>
            </a>
          )}

          <a href={searchUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span className="hidden sm:inline">Ultimate Guitar</span>
            </Button>
          </a>
        </div>

        {/* Tab content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-auto rounded-lg bg-background/50 border border-border/30 p-4 landscape:p-2 min-h-0">
          {hasTab ? (
            <pre
              className="tab-content"
              style={{ fontSize: `${fontSize}px` }}
            >
              <TabContentWithChords content={tabContent!} />
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
