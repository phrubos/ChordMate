'use client';

import { useEffect, useState } from 'react';
import { OnboardingModal } from './onboarding-modal';

export function OnboardingCheck({ needsOnboardingServer }: { needsOnboardingServer: boolean }) {
  const [show, setShow] = useState(needsOnboardingServer);

  // Sync state if server prop changes (e.g., after revalidatePath)
  useEffect(() => {
    setShow(needsOnboardingServer);
  }, [needsOnboardingServer]);

  if (!show) return null;

  return <OnboardingModal open={show} onSuccess={() => setShow(false)} />;
}
