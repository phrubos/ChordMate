'use client';

import { useEffect, useRef } from 'react';

export function MobileFrame({ width }: { width: number }) {
  const ref = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.delete('w');
    params.set('embed', '1');
    if (ref.current) ref.current.src = `/dev/ui?${params}${window.location.hash}`;
  }, []);

  return <iframe ref={ref} title="Mobil nézet" width={width} height={2400} style={{ border: 0, display: 'block' }} />;
}
