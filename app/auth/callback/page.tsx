'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '../../../lib/supabaseBrowser';

export default function AuthCallback() {
  const router = useRouter();
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    // Handle magic-link or PKCE redirects
    if (code) {
      // Exchange the auth code for a session
      supabaseBrowser.auth.exchangeCodeForSession(code).finally(() => {
        router.replace('/');
      });
    } else {
      router.replace('/');
    }
  }, [router]);
  return <p className="p-8">Completing sign-in…</p>;
} 