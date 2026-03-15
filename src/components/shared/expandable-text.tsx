'use client';

import { useState, useRef, useEffect } from 'react';
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
  const [isHoverDevice, setIsHoverDevice] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);

  // Detect hover-capable device (desktop) vs touch (mobile)
  useEffect(() => {
    setIsHoverDevice(window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  }, []);

  // Check if text actually overflows
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

  // Mobile: tap to expand/collapse
  const handleClick = (e: React.MouseEvent) => {
    if (isHoverDevice) return;
    if (!isTruncated && !expanded) return;
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
        !isHoverDevice && (isTruncated || expanded) && 'cursor-pointer',
        expanded && 'whitespace-normal break-words'
      )}
    >
      {children}
    </span>
  );

  // Desktop: wrap in tooltip when text is truncated
  if (isHoverDevice && isTruncated) {
    return (
      <Tooltip>
        <TooltipTrigger render={span} />
        <TooltipContent side="top" className="max-w-xs break-words whitespace-normal">
          {children}
        </TooltipContent>
      </Tooltip>
    );
  }

  // Mobile: just the span (tap handles expand/collapse)
  return span;
}
