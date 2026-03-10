'use client';

import { motion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { pageVariants, springs } from '@/lib/motion';
import type { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      transition={springs.gentle}
    >
      {children}
    </motion.div>
  );
}
