import { supabaseBrowser as supabase } from './supabaseBrowser';

// Database Types (matching your existing schema)
export interface VisaApplication {
  id: number
  first_name: string
  middle_name?: string
  last_name: string
  date_of_birth: string
  passport_no: string
  gender?: string
  whatsapp_number: string
  visa_type: string
  application_status: 'PENDING' | 'APPROVED' | 'REJECTED'
  submitted_at: string
  last_updated_at: string
  document_urls: string[]
  agent_notes?: string
  agent_id: string
  fees: number
  costs: number
  whatsapp_sent: boolean
  email?: string
  destination: string
  owner_email: string
  app_id?: string
}

// Database Functions
export const dbFunctions = {
  // Get all visa applications for an agent
  async getApplications() {
    // Fetch the currently signed-in user so we can filter by owner_email
    const {
      data: { session },
      error: sessErr,
    } = await supabase.auth.getSession();

    if (sessErr) throw sessErr;
    const email = session?.user?.email ?? '';

    const { data, error } = await supabase
      .from('visa_applications')
      .select('*')
      .eq('owner_email', email)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Create a new visa application
  async createApplication(application: Omit<VisaApplication, 'id' | 'submitted_at' | 'last_updated_at' | 'owner_email'>) {
    const now = new Date().toISOString();

    // Attach the owner_email from the current session
    const {
      data: { session },
      error: sessErr,
    } = await supabase.auth.getSession();

    if (sessErr) throw sessErr;
    const owner_email = session?.user?.email ?? 'unknown@no-session';

    const { data, error } = await supabase
      .from('visa_applications')
      .insert([
        {
          ...application,
          owner_email,
          agent_id: owner_email,
          submitted_at: now,
          last_updated_at: now,
        },
      ])
      .select();

    if (error) throw error;
    return data[0];
  },

  // Update an existing application
  async updateApplication(id: number, updates: Partial<VisaApplication>) {
    const { data, error } = await supabase
      .from('visa_applications')
      .update({
        ...updates,
        last_updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Delete an application
  async deleteApplication(id: number) {
    const { error } = await supabase
      .from('visa_applications')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    return true
  },

  // Get analytics data
  async getAnalytics() {
    const {
      data: { session },
      error: sessErr,
    } = await supabase.auth.getSession();

    if (sessErr) throw sessErr;
    const email = session?.user?.email ?? '';

    const { data: applications, error } = await supabase
      .from('visa_applications')
      .select('*')
      .eq('owner_email', email);

    if (error) throw error;
    
    // Calculate metrics
    const totalApplications = applications.length;
    const approvedApplications = applications.filter(app => app.application_status === 'APPROVED')
    const pendingApplications = applications.filter(app => app.application_status === 'PENDING')
    const rejectedApplications = applications.filter(app => app.application_status === 'REJECTED')
    
    const totalRevenue = approvedApplications.reduce((sum, app) => sum + app.fees, 0)
    const totalCosts = approvedApplications.reduce((sum, app) => sum + app.costs, 0)
    const totalProfit = totalRevenue - totalCosts
    
    const pendingRevenue = pendingApplications.reduce((sum, app) => sum + app.fees, 0)
    
    const successRate = totalApplications > 0 
      ? Math.round((approvedApplications.length / totalApplications) * 100 * 10) / 10
      : 0
    
    return {
      totalApplications,
      pendingRevenue,
      successRate,
      totalRevenue: totalProfit, // This is actually profit
      approvedCount: approvedApplications.length,
      pendingCount: pendingApplications.length,
      rejectedCount: rejectedApplications.length,
      applications
    }
  },

  // Get monthly analytics for charts
  async getMonthlyAnalytics() {
    const {
      data: { session },
      error: sessErr,
    } = await supabase.auth.getSession();

    if (sessErr) throw sessErr;
    const email = session?.user?.email ?? '';

    const { data: applications, error } = await supabase
      .from('visa_applications')
      .select('*')
      .eq('owner_email', email)
      .gte('submitted_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()); // Last 12 months

    if (error) throw error;
    
    // Group by month
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (11 - i))
      const month = date.toLocaleDateString('en-US', { month: 'short' })
      
      const monthApplications = applications.filter(app => {
        const appDate = new Date(app.submitted_at)
        return appDate.getMonth() === date.getMonth() && appDate.getFullYear() === date.getFullYear()
      })
      
      const approvedThisMonth = monthApplications.filter(app => app.application_status === 'APPROVED')
      const revenue = approvedThisMonth.reduce((sum, app) => sum + (app.fees - app.costs), 0)
      const successRate = monthApplications.length > 0 
        ? Math.round((approvedThisMonth.length / monthApplications.length) * 100)
        : 0
      
      return {
        month,
        applications: monthApplications.length,
        revenue,
        successRate,
        pending: monthApplications.filter(app => app.application_status === 'PENDING').length
      }
    })
    
    return monthlyData
  }
}

// The shared Supabase client (browser-aware, cookie-aware)
export { supabase }; 