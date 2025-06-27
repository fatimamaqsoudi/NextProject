'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useTenantSettings } from '../../components/TenantSettingsProvider';
import { supabaseBrowser } from '../../lib/supabaseBrowser';

export default function SettingsPage() {
  const { settings, refresh } = useTenantSettings();

  const [agencyName, setAgencyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setAgencyName(settings.agency_name);
      setLogoUrl(settings.logo_url || '');
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    const {
      data: { session },
      error: sessErr,
    } = await supabaseBrowser.auth.getSession();
    if (sessErr || !session?.user?.email) {
      setMessage('No active session');
      setSaving(false);
      return;
    }

    const { error } = await supabaseBrowser.from('tenant_settings').upsert({
      owner_email: session.user.email,
      agency_name: agencyName,
      logo_url: logoUrl.trim() || null,
    });

    if (error) {
      console.error(error);
      setMessage('Failed to save settings');
    } else {
      setMessage('Settings saved');
      await refresh();
    }
    setSaving(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Account Settings</h1>

        <div className="space-y-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Branding</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Agency Name</label>
                <input
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Logo URL (or /local-file.png)</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
            {message && <span className="ml-4 text-sm text-slate-600">{message}</span>}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 