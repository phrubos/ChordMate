'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const RemotionPlayer = dynamic(
  () => import('./remotion-player-inner'),
  {
    ssr: false,
    loading: () => (
      <div style={{ width: '100%', height: '100%', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(245,158,11,0.2)', borderTopColor: '#f59e0b', animation: 'spin 1s linear infinite' }} />
      </div>
    ),
  }
);

export function LoginPlayer() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ width: '100%', height: '100%', background: 'transparent' }} />;
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <RemotionPlayer />
    </div>
  );
}
