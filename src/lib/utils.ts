import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, differenceInDays, differenceInWeeks, differenceInMonths } from "date-fns"
import { hu } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function formatDate(date: Date | string, formatStr: string = 'yyyy. MMMM d.'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, formatStr, { locale: hu });
}

export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const days = differenceInDays(now, d);

  if (days === 0) return 'ma';
  if (days === 1) return 'tegnap';
  if (days < 7) return `${days} napja`;

  const weeks = differenceInWeeks(now, d);
  if (weeks < 4) return `${weeks} hete`;

  const months = differenceInMonths(now, d);
  if (months < 12) return `${months} hónapja`;

  return format(d, 'yyyy.MM.dd.', { locale: hu });
}
