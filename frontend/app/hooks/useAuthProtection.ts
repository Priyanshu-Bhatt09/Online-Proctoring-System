'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook to protect routes from unauthenticated users
 * Redirects to login if JWT token is not found in localStorage
 */
export function useAuthProtection() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/login');
    }
  }, [router]);
}
