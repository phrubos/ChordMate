'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

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
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    function check() {
      if (!el) return;
      // For single-line truncate: scrollWidth > clientWidth
      // For multi-line clamp: scrollHeight > clientHeight
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
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <span
      ref={textRef}
      onClick={handleClick}
      className={cn(
        className,
        !expanded && clampClassName,
        (isTruncated || expanded) && [
          mobileOnly ? 'md:pointer-events-none cursor-pointer md:cursor-default' : 'cursor-pointer',
        ],
        expanded && 'whitespace-normal break-words'
      )}
    >
      {children}
    </span>
  );
}
