'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { needsOnboarding } from '@/actions/bands';
import { OnboardingModal } from './onboarding-modal';

export function OnboardingCheck() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!session?.user || checked) return;
    // Don't show on login page
    if (pathname === '/login') return;

    needsOnboarding().then((needs) => {
      setShowOnboarding(needs);
      setChecked(true);
    });
  }, [session, pathname, checked]);

  if (!showOnboarding) return null;

  return <OnboardingModal open={showOnboarding} />;
}
