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
  const ref = useRef<HTMLElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const checkTruncation = useCallback(() => {
    const el = ref.current;
    if (el) {
      setIsTruncated(el.scrollWidth > el.clientWidth + 1);
    }
  }, []);

  useEffect(() => {
    checkTruncation();
    const observer = new ResizeObserver(checkTruncation);
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [checkTruncation, children]);

  const element = (
    <Tag
      ref={ref as React.Ref<HTMLElement>}
      className={cn('truncate', isTruncated && 'cursor-default', className)}
    >
      {children}
    </Tag>
  );

  if (!isTruncated) return element;

  return (
    <Tooltip>
      <TooltipTrigger render={element} />
      <TooltipContent side="top" className="max-w-xs break-words whitespace-normal">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
