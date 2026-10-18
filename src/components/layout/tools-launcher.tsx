'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';

const GuitarTunerModal = dynamic(() => import('@/components/tools/guitar-tuner-modal').then((m) => ({ default: m.GuitarTunerModal })), { ssr: false });
const MetronomeModal = dynamic(() => import('@/components/tools/metronome-modal').then((m) => ({ default: m.MetronomeModal })), { ssr: false });

type Tool = 'tuner' | 'metronome';

const ToolsContext = createContext<{ open: (tool: Tool) => void }>({ open: () => {} });

export const useTools = () => useContext(ToolsContext);

/** Owns the tuner/metronome modals so any nav surface can open them. */
export function ToolsLauncher({ children }: { children: ReactNode }) {
  const [tool, setTool] = useState<Tool | null>(null);
  const close = (open: boolean) => !open && setTool(null);

  return (
    <ToolsContext.Provider value={{ open: setTool }}>
      {children}
      {tool === 'tuner' && <GuitarTunerModal open onOpenChange={close} />}
      {tool === 'metronome' && <MetronomeModal open onOpenChange={close} />}
    </ToolsContext.Provider>
  );
}
