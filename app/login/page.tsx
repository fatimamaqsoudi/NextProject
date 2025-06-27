'use client';
import { useState } from 'react';
import { supabaseBrowser } from '../../lib/supabaseBrowser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const handleSend = async () => {
    if (!email) return;
    await supabaseBrowser.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setSent(true);
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-sky-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold text-center">Dashboard Login</h1>
        {sent ? (
          <p className="text-center text-sm text-slate-600">📨 Check your inbox for a magic link.</p>
        ) : (
          <>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border rounded px-3 py-2"
            />
            <button
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              onClick={handleSend}
              disabled={!email}
            >
              Send magic link
            </button>
          </>
        )}
      </div>
    </div>
  );
} 