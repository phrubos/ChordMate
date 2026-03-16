'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface ExpandableTextProps {
  children: string;
  className?: string;
  /** CSS class applied when collapsed (e.g. 'truncate', 'line-clamp-2') */
  clampClassName?: string;
}

export function ExpandableText({
  children,
  className,
  clampClassName = 'truncate',
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [open, setOpen] = useState(false);
  const textRef = useRef<HTMLElement | null>(null);

  const checkTruncation = useCallback(() => {
    const el = textRef.current;
    if (!el) return;
    const overflowX = el.scrollWidth > el.clientWidth + 1;
    const overflowY = el.scrollHeight > el.clientHeight + 1;
    setIsTruncated(overflowX || overflowY);
  }, []);

  useEffect(() => {
    checkTruncation();
    const ro = new ResizeObserver(checkTruncation);
    if (textRef.current) ro.observe(textRef.current);
    return () => ro.disconnect();
  }, [checkTruncation, children, expanded]);

  // Mobile tap: expand/collapse; Desktop tap on tooltip trigger: toggle tooltip
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!('ontouchstart' in window)) return;
    if (!isTruncated && !expanded) return;
    e.preventDefault();
    e.stopPropagation();
    setExpanded(prev => !prev);
  }, [isTruncated, expanded]);

  // Close tooltip on scroll (mobile tooltip use case)
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener('scroll', close, { capture: true });
    return () => document.removeEventListener('scroll', close, { capture: true });
  }, [open]);

  const refCallback = useCallback((node: HTMLSpanElement | null) => {
    textRef.current = node;
  }, []);

  const element = (
    <span
      ref={refCallback}
      onClick={handleClick}
      className={cn(
        className,
        !expanded && clampClassName,
        isTruncated && 'cursor-default',
        expanded && 'whitespace-normal break-words cursor-pointer'
      )}
    >
      {children}
    </span>
  );

  if (!isTruncated && !expanded) return element;

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger render={element} />
      <TooltipContent side="top" className="max-w-xs break-words whitespace-normal">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
