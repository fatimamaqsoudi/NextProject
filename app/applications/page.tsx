"use client";

import { useState, useEffect } from "react";
import { dbFunctions, VisaApplication } from '../../lib/supabase';
import DashboardLayout from '../../components/DashboardLayout';
import { downloadCSV } from '../../utils/exportCsv';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<VisaApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state for new applications
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    passport_no: "",
    whatsapp_number: "",
    destination: "",
    visa_type: "",
    fees: "",
    costs: "",
    date_of_birth: "",
    gender: "",
    email: "",
    document_urls: "",
    agent_notes: ""
  });

  // UI helpers for custom values
  const [showCustomDestination, setShowCustomDestination] = useState(false);
  const [showCustomVisaType, setShowCustomVisaType] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const applicationsData = await dbFunctions.getApplications();
      setApplications(applicationsData || []);
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please check your Supabase configuration.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      
      const applicationData = {
        first_name: formData.first_name,
        middle_name: formData.middle_name || undefined,
        last_name: formData.last_name,
        passport_no: formData.passport_no,
        whatsapp_number: formData.whatsapp_number,
        destination: formData.destination,
        visa_type: formData.visa_type,
        fees: parseFloat(formData.fees),
        costs: parseFloat(formData.costs),
        date_of_birth: formData.date_of_birth,
        gender: formData.gender || undefined,
        email: formData.email || undefined,
        document_urls: formData.document_urls ? [formData.document_urls] : [],
        agent_notes: formData.agent_notes || undefined,
        agent_id: '', // will be overwritten by backend
        whatsapp_sent: false,
        application_status: 'PENDING' as const
      };
      
      await dbFunctions.createApplication(applicationData);
      
      // Reset form
      setFormData({
        first_name: "",
        middle_name: "",
        last_name: "",
        passport_no: "",
        whatsapp_number: "",
        destination: "",
        visa_type: "",
        fees: "",
        costs: "",
        date_of_birth: "",
        gender: "",
        email: "",
        document_urls: "",
        agent_notes: ""
      });
      
      await loadData();
      alert("Application created successfully!");
      
    } catch (err) {
      console.error('Error creating application:', err);
      let errorMessage = 'Failed to create application. ';
      if (err instanceof Error) {
        errorMessage += `Error: ${err.message}`;
      }
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle select changes with custom option
  const handleDestinationSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "__custom") {
      setShowCustomDestination(true);
      setFormData(prev => ({ ...prev, destination: "" }));
    } else {
      setShowCustomDestination(false);
      setFormData(prev => ({ ...prev, destination: e.target.value }));
    }
  };

  const handleVisaTypeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "__custom") {
      setShowCustomVisaType(true);
      setFormData(prev => ({ ...prev, visa_type: "" }));
    } else {
      setShowCustomVisaType(false);
      setFormData(prev => ({ ...prev, visa_type: e.target.value }));
    }
  };

  // Handle application deletion
  const handleDelete = async (id: number) => {
    const app = applications.find(a => a.id === id);
    const applicantName = app ? `${app.first_name} ${app.last_name}` : 'this applicant';
    const confirmed = confirm(`⚠️  This will permanently delete the application for ${applicantName} (ID #${id}).\nThis action cannot be undone.\n\nAre you absolutely sure you want to proceed?`);
    if (!confirmed) return;
    
    try {
      await dbFunctions.deleteApplication(id);
      await loadData();
      alert('Application deleted successfully!');
    } catch (err) {
      console.error('Error deleting application:', err);
      alert('Failed to delete application. Please try again.');
    }
  };

  // Handle status update
  const handleStatusUpdate = async (id: number, newStatus: 'PENDING' | 'APPROVED' | 'REJECTED') => {
    try {
      await dbFunctions.updateApplication(id, { application_status: newStatus });
      await loadData();
      alert('Status updated successfully!');
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status. Please try again.');
    }
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'REJECTED':
        return 'bg-red-50 text-red-700 border border-red-200';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  const Icons = {
    plus: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
    delete: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    refresh: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    export: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
      </svg>
    )
  };

  // Export applications to CSV
  const handleExport = () => {
    if (applications.length === 0) {
      alert('No applications to export.');
      return;
    }
    const rows = applications.map(app => ({
      id: app.id,
      first_name: app.first_name,
      middle_name: app.middle_name,
      last_name: app.last_name,
      gender: app.gender,
      date_of_birth: app.date_of_birth,
      passport_no: app.passport_no,
      whatsapp_number: app.whatsapp_number,
      email: app.email,
      destination: app.destination,
      visa_type: app.visa_type,
      fees: app.fees,
      costs: app.costs,
      profit: app.fees - app.costs,
      application_status: app.application_status,
      agent_id: app.agent_id,
      submitted_at: app.submitted_at,
      last_updated_at: app.last_updated_at
    }));
    downloadCSV('applications.csv', rows);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading applications...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Connection Error</h2>
            <p className="text-slate-600 mb-4">{error}</p>
            <button 
              onClick={loadData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-slate-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          
          {/* ===== NEW APPLICATION FORM ===== */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">New Visa Application</h2>
                <p className="text-slate-600 mt-1">Enter customer details for visa processing</p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
                <input 
                  type="text" 
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  placeholder="Enter first name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Middle Name (Optional)</label>
                <input 
                  type="text" 
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  placeholder="Enter middle name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
                <input 
                  type="text" 
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  placeholder="Enter last name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Passport Number</label>
                <input 
                  type="text" 
                  name="passport_no"
                  value={formData.passport_no}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  placeholder="AB123456"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">WhatsApp Number</label>
                <input 
                  type="tel" 
                  name="whatsapp_number"
                  value={formData.whatsapp_number}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  placeholder="+93701234567"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Destination</label>
                <select
                  value={showCustomDestination ? "__custom" : formData.destination}
                  onChange={handleDestinationSelect}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                >
                  <option value="">Select destination</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="Germany">Germany</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="United States">United States</option>
                  <option value="__custom">Other...</option>
                </select>
                {showCustomDestination && (
                  <input
                    type="text"
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    placeholder="Enter destination country"
                    className="mt-3 w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    required
                  />
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Visa Type</label>
                <select
                  value={showCustomVisaType ? "__custom" : formData.visa_type}
                  onChange={handleVisaTypeSelect}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                >
                  <option value="">Select visa type</option>
                  <option value="Tourist">Tourist</option>
                  <option value="Student">Student</option>
                  <option value="Work">Work</option>
                  <option value="Business">Business</option>
                  <option value="Medical">Medical</option>
                  <option value="__custom">Other...</option>
                </select>
                {showCustomVisaType && (
                  <input
                    type="text"
                    name="visa_type"
                    value={formData.visa_type}
                    onChange={handleInputChange}
                    placeholder="Enter visa type"
                    className="mt-3 w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    required
                  />
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Fees ($)</label>
                <input 
                  type="number" 
                  name="fees"
                  value={formData.fees}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  placeholder="850"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Costs ($)</label>
                <input 
                  type="number" 
                  name="costs"
                  value={formData.costs}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  placeholder="320"
                  required
                />
              </div>
              
              <div className="md:col-span-2 lg:col-span-1">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Date of Birth</label>
                <input 
                  type="date" 
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Gender</label>
                <select 
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email (Optional)</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  placeholder="customer@email.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Document URL (Optional)</label>
                <input 
                  type="url" 
                  name="document_urls"
                  value={formData.document_urls}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  placeholder="https://example.com/document.pdf"
                />
              </div>
              
              <div className="md:col-span-1 lg:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Agent Notes (Optional)</label>
                <textarea 
                  name="agent_notes"
                  value={formData.agent_notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white resize-none"
                  placeholder="Add any additional notes about this application..."
                />
              </div>
              
              <div className="md:col-span-2 lg:col-span-3">
                <button 
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{submitting ? 'Creating...' : 'Create Application'}</span>
                  {Icons.plus}
                </button>
              </div>
            </form>
          </div>

          {/* ===== EXISTING APPLICATIONS TABLE ===== */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Recent Applications</h3>
                  <p className="text-sm text-slate-500">Manage and track visa applications</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={loadData}
                    className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                    title="Refresh data"
                  >
                    {Icons.refresh}
                  </button>
                  <button onClick={handleExport} className="p-2 text-slate-400 hover:text-slate-600 transition-colors" title="Export CSV">
                    {Icons.export}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Customer Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Passport & DOB</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Destination</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Financials</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Communication</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Dates</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Notes</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-6 py-8 text-center text-slate-500">
                        No applications found. Create your first application above!
                      </td>
                    </tr>
                  ) : (
                    applications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-slate-700">#{app.id}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {app.first_name} {app.middle_name ? app.middle_name + ' ' : ''}{app.last_name}
                            </div>
                            <div className="text-sm text-slate-500">
                              {app.gender && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                                  {app.gender}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-slate-900">{app.whatsapp_number}</div>
                            {app.email && (
                              <div className="text-sm text-slate-500">{app.email}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-mono text-slate-700">{app.passport_no}</div>
                            <div className="text-sm text-slate-500">
                              DOB: {new Date(app.date_of_birth).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-slate-900">{app.destination}</div>
                            <div className="text-sm text-slate-500">{app.visa_type}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Fees: ${app.fees}</div>
                            <div className="text-sm text-slate-500">Costs: ${app.costs}</div>
                            <div className="text-sm font-medium text-green-600">Profit: ${app.fees - app.costs}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <select
                            value={app.application_status}
                            onChange={(e) => handleStatusUpdate(app.id, e.target.value as 'PENDING' | 'APPROVED' | 'REJECTED')}
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(app.application_status)} uppercase`}
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="APPROVED">APPROVED</option>
                            <option value="REJECTED">REJECTED</option>
                          </select>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-slate-600">WhatsApp:</span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                app.whatsapp_sent 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {app.whatsapp_sent ? '✓ Sent' : '✗ Not Sent'}
                              </span>
                            </div>
                            {app.document_urls && app.document_urls.length > 0 && (
                              <div className="text-xs text-blue-600 mt-1">
                                {app.document_urls.length} document(s)
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-slate-600">
                              Submitted: {new Date(app.submitted_at).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-slate-500">
                              Updated: {new Date(app.last_updated_at).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="max-w-xs">
                            {app.agent_notes ? (
                              <div className="text-sm text-slate-600 truncate" title={app.agent_notes}>
                                {app.agent_notes}
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400 italic">No notes</span>
                            )}
                            <div className="text-xs text-slate-500 mt-1">
                              Agent: {app.agent_id}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleDelete(app.id)}
                              className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                              title="Delete application"
                            >
                              {Icons.delete}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 