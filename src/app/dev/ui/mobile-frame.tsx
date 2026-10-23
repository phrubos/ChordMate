'use client';

import { useEffect, useRef, useState } from 'react';

/** Innermost elements sticking out past the right edge — the cause of horizontal page scroll. */
function findOverflow(doc: Document): string[] {
  const width = doc.documentElement.clientWidth;
  if (doc.documentElement.scrollWidth <= width) return [];
  const out: string[] = [];
  for (const el of Array.from(doc.body.querySelectorAll<HTMLElement>('*'))) {
    if (el.getBoundingClientRect().right <= width + 1) continue;
    // Skip content clipped by a scrolling/hidden ancestor — it does not widen the page.
    let clipped = false;
    for (let p = el.parentElement; p && p !== doc.body; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX;
      if (o !== 'visible' && p.getBoundingClientRect().right <= width + 1) {
        clipped = true;
        break;
      }
    }
    if (clipped) continue;
    const childOut = Array.from(el.children).some((c) => c.getBoundingClientRect().right > width + 1);
    if (!childOut) out.push(`${el.tagName.toLowerCase()}.${(typeof el.className === 'string' ? el.className : '').slice(0, 90)} | ${(el.textContent ?? '').trim().slice(0, 40)}`);
    if (out.length >= 12) break;
  }
  if (out.length === 0) {
    // Nothing visible sticks out: list the widest raw offenders (often an invisible/absolute element).
    for (const el of Array.from(doc.body.querySelectorAll<HTMLElement>('*'))) {
      const r = el.getBoundingClientRect();
      if (r.right > width + 1) out.push(`(raw) ${el.tagName.toLowerCase()}.${(typeof el.className === 'string' ? el.className : '').slice(0, 90)} right=${Math.round(r.right)}`);
      if (out.length >= 8) break;
    }
  }
  return [`scrollWidth ${doc.documentElement.scrollWidth} > ${width}`, ...out];
}

export function MobileFrame({ width }: { width: number }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [report, setReport] = useState<string[] | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.delete('w');
    params.set('embed', '1');
    const frame = ref.current;
    if (!frame) return;
    frame.src = `/dev/ui?${params}${window.location.hash}`;
    const onLoad = () => window.setTimeout(() => frame.contentDocument && setReport(findOverflow(frame.contentDocument)), 1500);
    frame.addEventListener('load', onLoad);
    return () => frame.removeEventListener('load', onLoad);
  }, []);

  return (
    <>
      <pre id="overflow-report" data-done={report ? '1' : undefined} style={{ fontSize: 11, whiteSpace: 'pre-wrap', margin: 0 }}>
        {report && (report.length ? report.join('\n') : 'no horizontal overflow')}
      </pre>
      <iframe ref={ref} title="Mobil nézet" width={width} height={2400} style={{ border: 0, display: 'block' }} />
    </>
  );
}
