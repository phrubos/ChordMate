'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface ExpandableTextProps {
  children: string;
  className?: string;
  /** CSS class applied when collapsed (e.g. 'truncate', 'line-clamp-2') */
  clampClassName?: string;
  /** Only enable expand on mobile (< md breakpoint). Default: true */
  mobileOnly?: boolean;
}

export function ExpandableText({
  children,
  className,
  clampClassName = 'truncate',
  mobileOnly = true,
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    function check() {
      if (!el) return;
      const overflowX = el.scrollWidth > el.clientWidth + 1;
      const overflowY = el.scrollHeight > el.clientHeight + 1;
      setIsTruncated(overflowX || overflowY);
    }

    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children, expanded]);

  const handleClick = (e: React.MouseEvent) => {
    if (!isTruncated && !expanded) return;
    // Mobile only: tap to expand/collapse
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const span = (
    <span
      ref={textRef}
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

  if (!isTruncated && !expanded) return span;

  return (
    <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
      <TooltipTrigger render={span} />
      <TooltipContent side="top" className="max-w-xs break-words whitespace-normal">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
