'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TruncatedTextProps {
  children: string;
  className?: string;
  as?: 'p' | 'span' | 'h3';
}

/**
 * Renders text with truncation. When text overflows:
 * - Desktop: shows full text in a tooltip on hover
 * - Mobile/Tablet: shows full text in a tooltip on tap
 */
export function TruncatedText({ children, className, as: Tag = 'span' }: TruncatedTextProps) {
  const elRef = useRef<HTMLElement | null>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [open, setOpen] = useState(false);

  const checkTruncation = useCallback(() => {
    const el = elRef.current;
    if (el) {
      setIsTruncated(el.scrollWidth > el.clientWidth + 1);
    }
  }, []);

  useEffect(() => {
    checkTruncation();
    const observer = new ResizeObserver(checkTruncation);
    if (elRef.current) observer.observe(elRef.current);
    return () => observer.disconnect();
  }, [checkTruncation, children]);

  const refCallback = useCallback((node: HTMLParagraphElement | HTMLSpanElement | HTMLHeadingElement | null) => {
    elRef.current = node;
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!('ontouchstart' in window)) return;
    e.preventDefault();
    e.stopPropagation();
    setOpen(prev => !prev);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener('scroll', close, { capture: true });
    return () => document.removeEventListener('scroll', close, { capture: true });
  }, [open]);

  const element = (
    <Tag
      ref={refCallback}
      className={cn('truncate', isTruncated && 'cursor-default', className)}
      onClick={isTruncated ? handleClick : undefined}
    >
      {children}
    </Tag>
  );

  if (!isTruncated) return element;

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger render={element} />
      <TooltipContent side="top" className="max-w-xs break-words whitespace-normal">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
