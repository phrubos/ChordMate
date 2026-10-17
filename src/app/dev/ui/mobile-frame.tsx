'use client';

import { useEffect, useRef } from 'react';

export function MobileFrame({ width }: { width: number }) {
  const ref = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.src = `/dev/ui?embed=1${window.location.hash}`;
  }, []);

  return <iframe ref={ref} title="Mobil nézet" width={width} height={2400} style={{ border: 0, display: 'block' }} />;
}
