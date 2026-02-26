'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GoalsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard - Goals feature is disabled
    router.replace('/dashboard');
  }, [router]);

  return null;
}
