import './globals.css';
import SupabaseProvider from '../components/SupabaseProvider';
import TenantSettingsProvider from '../components/TenantSettingsProvider';

export const metadata = {
  title: 'Habibi Smart Travels & Tours Agency - Visa Application Management',
  description: 'Comprehensive visa application management system for travel agents',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-sky-50 min-h-screen">
        <SupabaseProvider>
          <TenantSettingsProvider>{children}</TenantSettingsProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}