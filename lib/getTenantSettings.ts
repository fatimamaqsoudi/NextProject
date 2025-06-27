import { supabaseBrowser as supabase } from './supabaseBrowser';

export interface TenantSettings {
  owner_email: string;
  agency_name: string;
  logo_url: string | null;
  visible_fields: string[] | null;
}

export async function getTenantSettings(): Promise<TenantSettings | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.email) return null;

  const { data, error } = await supabase
    .from('tenant_settings')
    .select('*')
    .eq('owner_email', session.user.email)
    .single();

  if (error) {
    console.error('Error fetching tenant settings', error);
    return null;
  }

  return data as TenantSettings;
} 