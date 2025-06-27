"use client";

import { useState, useEffect } from "react";
import { dbFunctions, VisaApplication } from '../../lib/supabase';
import DashboardLayout, { TimePeriod } from '../../components/DashboardLayout';
import { downloadCSV } from '../../utils/exportCsv';

export default function AllApplicationsPage() {
  const [applications, setApplications] = useState<VisaApplication[]>([]);
  const [allApplications, setAllApplications] = useState<VisaApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [editingRows, setEditingRows] = useState<Set<number>>(new Set());
  const [editingField, setEditingField] = useState<{appId: number, field: string} | null>(null);
  const [focusedRow, setFocusedRow] = useState<number | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('Month');
  const [rowDrafts, setRowDrafts] = useState<Record<number, Partial<VisaApplication>>>({});

  useEffect(() => {
    loadApplications();
  }, []);

  // Add keyboard event listener for focus mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && focusedRow !== null) {
        setFocusedRow(null);
      }
    };

    if (focusedRow !== null) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [focusedRow]);

  // Filter applications when time period changes
  useEffect(() => {
    if (allApplications.length > 0) {
      filterApplicationsByTimePeriod();
    }
  }, [timePeriod, allApplications]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await dbFunctions.getApplications();
      setAllApplications(data || []);
      setApplications(data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterApplicationsByTimePeriod = () => {
    const now = new Date();
    let startDate: Date;

    switch (timePeriod) {
      case 'Today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'Week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'Month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'Year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Filter applications by time period
    const filteredByTime = allApplications.filter(app => 
      new Date(app.submitted_at) >= startDate
    );

    setApplications(filteredByTime);
  };

  const handleTimeFilterChange = (period: TimePeriod) => {
    setTimePeriod(period);
  };

  // Filter and sort applications (now using the time-filtered applications)
  const filteredApplications = applications
    .filter(app => {
      const matchesSearch = 
        app.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.passport_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.destination.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "ALL" || app.application_status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch(sortBy) {
        case "newest":
          return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
        case "oldest":
          return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
        case "name":
          return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
        case "status":
          return a.application_status.localeCompare(b.application_status);
        default:
          return 0;
      }
    });

  const handleStatusUpdate = async (id: number, newStatus: 'PENDING' | 'APPROVED' | 'REJECTED') => {
    try {
      await dbFunctions.updateApplication(id, { application_status: newStatus });
      await loadApplications();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    const app = allApplications.find(a => a.id === id);
    const applicantName = app ? `${app.first_name} ${app.last_name}` : 'this applicant';
    const confirmed = confirm(`⚠️  This will permanently delete the application for ${applicantName} (ID #${id}).\nThis action cannot be undone.\n\nAre you absolutely sure you want to proceed?`);
    if (!confirmed) return;
    
    try {
      await dbFunctions.deleteApplication(id);
      await loadApplications();
      alert('Application deleted successfully!');
    } catch (err) {
      console.error('Error deleting application:', err);
      alert('Failed to delete application. Please try again.');
    }
  };

  // Enter edit mode for a row
  const toggleEditMode = (appId: number) => {
    const newEditingRows = new Set(editingRows);
    const isCurrentlyEditing = newEditingRows.has(appId);

    if (!isCurrentlyEditing) {
      // Entering edit mode.
      newEditingRows.add(appId);
    }
    setEditingRows(newEditingRows);
    setEditingField(null);
  };

  // Stash field updates locally (no DB write yet)
  const handleFieldUpdate = (appId: number, field: string, value: string | number) => {
    // Prepare formatted value
    let formatted: any = value;
    if (field === 'fees' || field === 'costs') {
      formatted = parseFloat(value as string) || 0;
    } else if (field === 'whatsapp_sent') {
      formatted = value === '✓ Sent';
    } else if (field === 'gender') {
      const genderMap: Record<string, string> = { 'M': 'Male', 'F': 'Female', 'O': 'Other', 'N/A': 'Not specified' };
      formatted = genderMap[value as string] || value;
    }

    // Store draft
    setRowDrafts(prev => ({
      ...prev,
      [appId]: {
        ...(prev[appId] || {}),
        [field]: formatted
      }
    }));

    // Update UI instantly
    setApplications(prev => prev.map(app => app.id === appId ? { ...app, [field]: formatted } : app));
    setAllApplications(prev => prev.map(app => app.id === appId ? { ...app, [field]: formatted } : app));
  };

  // Save drafts for a row
  const handleSave = async (appId: number) => {
    const drafts = rowDrafts[appId];
    const newEditingRows = new Set(editingRows);
    newEditingRows.delete(appId);
    setEditingRows(newEditingRows);
    setEditingField(null);

    if (drafts && Object.keys(drafts).length > 0) {
      try {
        await dbFunctions.updateApplication(appId, drafts);
      } catch (err) {
        console.error('Error saving edits:', err);
        alert('Failed to save edits. Please try again.');
      }
    }

    // Clear drafts and refresh
    setRowDrafts(prev => {
      const copy = { ...prev };
      delete copy[appId];
      return copy;
    });
    loadApplications();
  };

  // Discard drafts
  const handleCancel = (appId: number) => {
    setRowDrafts(prev => {
      const copy = { ...prev };
      delete copy[appId];
      return copy;
    });

    const newEditingRows = new Set(editingRows);
    newEditingRows.delete(appId);
    setEditingRows(newEditingRows);
    setEditingField(null);
    loadApplications();
  };

  // Inline editable field
  const EditableField = ({
    app,
    field,
    value,
    type = 'text',
    options = null,
    className = '',
    placeholder = ''
  }: {
    app: VisaApplication;
    field: string;
    value: any;
    type?: 'text' | 'email' | 'tel' | 'date' | 'number' | 'select';
    options?: string[] | null;
    className?: string;
    placeholder?: string;
  }) => {
    const draftVal = rowDrafts[app.id] ? (rowDrafts[app.id] as any)[field] : undefined;
    const initialVal = draftVal !== undefined ? draftVal : value;

    const isEditingField = editingField?.appId === app.id && editingField?.field === field;
    const isRowEditable = editingRows.has(app.id);

    if (!isRowEditable) {
      return <span className={className}>{initialVal}</span>;
    }

    if (isEditingField) {
      const [localValue, setLocalValue] = useState<string | number>(initialVal);

      const commit = (v: string | number) => {
        handleFieldUpdate(app.id, field, v);
        setEditingField(null);
      };

      if (type === 'select' && options) {
        return (
          <select
            value={localValue as string}
            onChange={(e) => {
              setLocalValue(e.target.value);
              commit(e.target.value);
            }}
            onBlur={() => commit(localValue)}
            autoFocus
            className="bg-white border border-blue-300 rounded px-2 py-1 text-sm min-w-0 w-full"
          >
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      }

      return (
        <input
          type={type}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={() => commit(localValue)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
            }
          }}
          autoFocus
          className="bg-white border border-blue-300 rounded px-2 py-1 text-sm min-w-0 w-full"
          placeholder={placeholder}
        />
      );
    }

    return (
      <span
        className={`${className} cursor-pointer hover:bg-blue-100 rounded px-1 py-0.5 transition-colors`}
        onClick={() => setEditingField({ appId: app.id, field })}
        title="Click to edit"
      >
        {initialVal || placeholder}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'APPROVED':
        return {
          bg: 'bg-gradient-to-r from-emerald-500 to-green-600',
          text: 'text-white',
          shadow: 'shadow-lg shadow-emerald-500/25',
          glow: 'hover:shadow-xl hover:shadow-emerald-500/40'
        };
      case 'PENDING':
        return {
          bg: 'bg-gradient-to-r from-amber-500 to-orange-600',
          text: 'text-white',
          shadow: 'shadow-lg shadow-amber-500/25',
          glow: 'hover:shadow-xl hover:shadow-amber-500/40'
        };
      case 'REJECTED':
        return {
          bg: 'bg-gradient-to-r from-red-500 to-rose-600',
          text: 'text-white',
          shadow: 'shadow-lg shadow-red-500/25',
          glow: 'hover:shadow-xl hover:shadow-red-500/40'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-slate-500 to-gray-600',
          text: 'text-white',
          shadow: 'shadow-lg shadow-slate-500/25',
          glow: 'hover:shadow-xl hover:shadow-slate-500/40'
        };
    }
  };

  const Icons = {
    search: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    filter: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
      </svg>
    ),
    sort: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    ),
    delete: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    edit: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4H6a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-5m-8-9l-1 1m0 0l6 6m-6-6L7 14m6-6l1 1" />
      </svg>
    ),
    save: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    cancel: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    user: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    phone: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    passport: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    location: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    money: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    ),
    calendar: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    export: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    )
  };

  // Handle double click to focus on a row
  const handleRowDoubleClick = (appId: number) => {
    if (focusedRow === appId) {
      // If already focused, unfocus
      setFocusedRow(null);
    } else {
      // Focus on this row
      setFocusedRow(appId);
    }
  };

  // Handle clicking outside to unfocus
  const handleBackgroundClick = () => {
    if (focusedRow !== null) {
      setFocusedRow(null);
    }
  };

  // Export filtered applications to CSV
  const handleExport = () => {
    if (filteredApplications.length === 0) {
      alert('No applications to export.');
      return;
    }
    const rows = filteredApplications.map(app => ({
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
    downloadCSV(`applications_${timePeriod.toLowerCase()}.csv`, rows);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600 text-lg">Loading applications...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout onTimeFilterChange={handleTimeFilterChange} defaultTimePeriod="Month">
      <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8 relative">
        {/* Enhanced Background Pattern */}
        <div 
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 25px 25px, rgb(59 130 246 / 0.2) 2px, transparent 0),
              radial-gradient(circle at 75px 75px, rgb(99 102 241 / 0.15) 1px, transparent 0)
            `,
            backgroundSize: '100px 100px, 50px 50px'
          }}
        ></div>
        
        {/* Floating gradient orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-purple-200/20 to-pink-200/20 rounded-full blur-3xl animate-pulse pointer-events-none" style={{animationDelay: '2s'}}></div>

        {/* Page Header with Search and Filters */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-blue-200/50 shadow-xl mb-8 relative z-10">
          <div className="px-6 py-4">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div>
                <h1 className="text-2xl xl:text-3xl font-black text-slate-800 mb-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  All Applications • {timePeriod}
                </h1>
                <p className="text-slate-600 text-sm font-medium">
                  Manage and track all visa applications • <span className="text-blue-600 font-bold">{filteredApplications.length}</span> total for {timePeriod.toLowerCase()}
                </p>
              </div>

              {/* Enhanced Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <div className="text-slate-500 group-focus-within:text-blue-500 transition-colors">{Icons.search}</div>
                  </div>
                  <input
                    type="text"
                    placeholder="Search applications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-3 py-2.5 w-full sm:w-72 bg-white/95 backdrop-blur-sm border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-slate-700 placeholder-slate-400 shadow-lg hover:shadow-xl font-medium text-sm"
                  />
                </div>

                {/* Status Filter */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <div className="text-slate-500 group-focus-within:text-blue-500 transition-colors">{Icons.filter}</div>
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-10 pr-8 py-2.5 bg-white/95 backdrop-blur-sm border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-slate-700 appearance-none cursor-pointer shadow-lg hover:shadow-xl font-medium text-sm"
                  >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                {/* Sort */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <div className="text-slate-500 group-focus-within:text-blue-500 transition-colors">{Icons.sort}</div>
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="pl-10 pr-8 py-2.5 bg-white/95 backdrop-blur-sm border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-slate-700 appearance-none cursor-pointer shadow-lg hover:shadow-xl font-medium text-sm"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="name">Name A-Z</option>
                    <option value="status">Status</option>
                  </select>
                </div>

                {/* Export */}
                <button
                  onClick={handleExport}
                  className="relative group p-2.5 bg-white/95 backdrop-blur-sm border-2 border-slate-200 rounded-xl hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl text-slate-500 hover:text-blue-600 flex items-center justify-center"
                  title="Export CSV"
                >
                  {Icons.export}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4 relative z-10">
          {filteredApplications.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-md rounded-3xl border-2 border-slate-200 p-16 text-center shadow-xl">
              <div className="text-slate-600 text-xl font-medium">
                {searchTerm || statusFilter !== "ALL" 
                  ? "No applications match your filters" 
                  : "No applications found"}
              </div>
            </div>
          ) : (
            <>
              {/* Focus Mode Overlay */}
              {focusedRow !== null && (
                <div 
                  className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 transition-all duration-500 ease-in-out"
                  onClick={handleBackgroundClick}
                />
              )}
              
              {filteredApplications.map((app) => {
                const statusInfo = getStatusBadge(app.application_status);
                const isEditing = editingRows.has(app.id);
                const isFocused = focusedRow === app.id;
                const isBlurred = focusedRow !== null && focusedRow !== app.id;
                
                return (
                  <div
                    key={app.id}
                    className={`bg-white/95 backdrop-blur-md rounded-2xl border-2 shadow-lg transition-all duration-500 ease-in-out overflow-hidden group cursor-pointer ${
                      isEditing 
                        ? 'border-blue-400/70 ring-2 ring-blue-300/50' 
                        : 'border-slate-200/50 hover:border-blue-300/50'
                    } ${
                      isFocused 
                        ? 'relative z-30 shadow-2xl border-blue-500/70 ring-4 ring-blue-300/50' 
                        : isBlurred 
                          ? 'opacity-30 blur-sm pointer-events-none' 
                          : 'hover:shadow-xl'
                    }`}
                    onDoubleClick={() => handleRowDoubleClick(app.id)}
                    style={{
                      transform: isFocused ? 'scale(1.01)' : isBlurred ? 'scale(0.99)' : 'scale(1)',
                      zIndex: isFocused ? 30 : isBlurred ? 10 : 20
                    }}
                  >
                    {/* Focus Mode Indicator */}
                    {isFocused && (
                      <div className="absolute top-4 right-4 z-40">
                        <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                          FOCUSED • Double-click or Press ESC to exit
                        </div>
                      </div>
                    )}

                    {/* Main Row - Consistent Sizing */}
                    <div className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-20 gap-4 lg:gap-6 items-center">
                        
                        {/* Sequential Number - 1 col */}
                        <div className="lg:col-span-1">
                          <div className="text-center">
                            <div className={`w-8 h-8 ${isFocused ? 'bg-blue-600' : 'bg-blue-500'} text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto transition-all duration-300`}>
                              {filteredApplications.indexOf(app) + 1}
                            </div>
                          </div>
                        </div>

                        {/* Customer Info - 4 cols */}
                        <div className="lg:col-span-4">
                          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200/50 hover:shadow-md transition-all duration-300 h-20 flex flex-col justify-between relative">
                            <div className="text-slate-800 font-bold text-base min-h-0 overflow-visible">
                              <div className="flex flex-wrap gap-1 items-center">
                                <EditableField 
                                  app={app} 
                                  field="first_name" 
                                  value={app.first_name} 
                                  placeholder="First Name"
                                  className="font-bold"
                                />
                                {app.middle_name && (
                                  <EditableField 
                                    app={app} 
                                    field="middle_name" 
                                    value={app.middle_name} 
                                    placeholder="Middle"
                                    className="font-bold"
                                  />
                                )}
                                <EditableField 
                                  app={app} 
                                  field="last_name" 
                                  value={app.last_name} 
                                  placeholder="Last Name"
                                  className="font-bold"
                                />
                              </div>
                            </div>
                            
                            {/* Gender in bottom right corner */}
                            <div className="absolute bottom-2 right-2">
                              <span className="bg-slate-300 px-2 py-1 rounded text-xs font-bold text-slate-700">
                                <EditableField 
                                  app={app} 
                                  field="gender" 
                                  value={
                                    app.gender === 'Male' ? 'M' : 
                                    app.gender === 'Female' ? 'F' : 
                                    app.gender === 'Other' ? 'O' : 'N/A'
                                  } 
                                  type="select"
                                  options={['M', 'F', 'O', 'N/A']}
                                />
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Contact Info - 4 cols */}
                        <div className="lg:col-span-4">
                          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200/50 hover:shadow-md transition-all duration-300 h-20 flex flex-col justify-center">
                            <div className="flex items-center space-x-2 mb-1">
                              {Icons.phone}
                              <span className="text-slate-800 font-semibold text-sm truncate">
                                <EditableField 
                                  app={app} 
                                  field="whatsapp_number" 
                                  value={app.whatsapp_number} 
                                  type="tel"
                                  placeholder="WhatsApp Number"
                                />
                              </span>
                            </div>
                            <div className="text-slate-600 text-xs truncate">
                              <EditableField 
                                app={app} 
                                field="email" 
                                value={app.email || ''} 
                                type="email"
                                placeholder="Email address"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Passport & DOB - 3 cols */}
                        <div className="lg:col-span-3">
                          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200/50 hover:shadow-md transition-all duration-300 h-20 flex flex-col justify-center">
                            <div className="flex items-center space-x-2 mb-1">
                              {Icons.passport}
                              <span className="text-slate-800 font-mono font-bold text-sm">
                                <EditableField 
                                  app={app} 
                                  field="passport_no" 
                                  value={app.passport_no} 
                                  placeholder="Passport Number"
                                />
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {Icons.calendar}
                              <span className="text-slate-600 text-xs">
                                <EditableField 
                                  app={app} 
                                  field="date_of_birth" 
                                  value={app.date_of_birth} 
                                  type="date"
                                />
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Destination & Visa - 3 cols */}
                        <div className="lg:col-span-3">
                          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200/50 hover:shadow-md transition-all duration-300 h-20 flex flex-col justify-center">
                            <div className="flex items-center space-x-2 mb-1">
                              {Icons.location}
                              <span className="text-slate-800 font-bold text-sm">
                                <EditableField 
                                  app={app} 
                                  field="destination" 
                                  value={app.destination} 
                                  type="select"
                                  options={['Canada', 'Australia', 'Germany', 'UK', 'USA', 'France', 'Italy', 'Netherlands']}
                                />
                              </span>
                            </div>
                            <div className="bg-slate-300 px-2 py-1 rounded-lg text-xs font-medium text-slate-700 inline-block">
                              <EditableField 
                                app={app} 
                                field="visa_type" 
                                value={app.visa_type} 
                                type="select"
                                options={['Tourist', 'Student', 'Work', 'Business', 'Transit']}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Status & Actions - 2 cols */}
                        <div className="lg:col-span-2">
                          <div className="flex flex-col items-center space-y-3">
                            {/* Clean Status Badge */}
                            <div className="w-full">
                              <select
                                value={app.application_status}
                                onChange={(e) => handleStatusUpdate(app.id, e.target.value as 'PENDING' | 'APPROVED' | 'REJECTED')}
                                className={`
                                  ${statusInfo.bg} ${statusInfo.text} ${statusInfo.shadow} ${statusInfo.glow}
                                  px-4 py-2 rounded-xl text-xs font-bold border-0 cursor-pointer
                                  appearance-none text-center w-full
                                  transform hover:scale-105 transition-all duration-300
                                  focus:ring-4 focus:ring-white/50 focus:outline-none
                                `}
                              >
                                <option value="PENDING">PENDING</option>
                                <option value="APPROVED">APPROVED</option>
                                <option value="REJECTED">REJECTED</option>
                              </select>
                            </div>

                            {/* Edit/Save & Delete Buttons */}
                            {isEditing ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSave(app.id);
                                  }}
                                  className="p-2 text-green-600 hover:text-white hover:bg-green-500 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-green-500/25"
                                  title="Save changes"
                                >
                                  {Icons.save}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancel(app.id);
                                  }}
                                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-500 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-slate-500/25"
                                  title="Discard changes"
                                >
                                  {Icons.cancel}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(app.id);
                                  }}
                                  className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-red-500/25"
                                  title="Delete application"
                                >
                                  {Icons.delete}
                                </button>
                              </div>
                            ) : (
                              <div className="flex space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleEditMode(app.id);
                                  }}
                                  className="p-2 text-blue-500 hover:text-white hover:bg-blue-500 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/25"
                                  title="Edit application"
                                >
                                  {Icons.edit}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(app.id);
                                  }}
                                  className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-red-500/25"
                                  title="Delete application"
                                >
                                  {Icons.delete}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Financial Info - 3 cols */}
                        <div className="lg:col-span-3">
                          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200/50 hover:shadow-md transition-all duration-300 h-20 flex flex-col justify-center">
                            <div className="flex items-center space-x-2 mb-1">
                              {Icons.money}
                              <span className="text-xs text-slate-600">Fees:</span>
                              <span className="font-bold text-slate-800 text-sm">
                                $<EditableField 
                                  app={app} 
                                  field="fees" 
                                  value={app.fees} 
                                  type="number"
                                  placeholder="0"
                                />
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 mb-1">
                              Costs: $<EditableField 
                                app={app} 
                                field="costs" 
                                value={app.costs} 
                                type="number"
                                placeholder="0"
                              />
                            </div>
                            <div className={`px-2 py-1 rounded-lg text-xs font-bold inline-block ${
                              app.fees - app.costs > 0 
                                ? 'bg-emerald-200 text-emerald-800' 
                                : 'bg-red-200 text-red-800'
                            }`}>
                              Profit: ${app.fees - app.costs}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Compact Bottom Row */}
                      <div className="mt-4 pt-4 border-t border-slate-200/50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          
                          {/* Communication - Compact */}
                          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/50">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-600">COMMUNICATION</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                app.whatsapp_sent 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-gray-400 text-white'
                              }`}>
                                <EditableField 
                                  app={app} 
                                  field="whatsapp_sent" 
                                  value={app.whatsapp_sent ? '✓ Sent' : '✗ Pending'} 
                                  type="select"
                                  options={['✓ Sent', '✗ Pending']}
                                />
                              </span>
                            </div>
                          </div>

                          {/* Timeline - Compact */}
                          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/50">
                            <div className="text-xs font-semibold text-slate-600 mb-1">TIMELINE</div>
                            <div className="text-xs text-slate-700">
                              Submitted: {new Date(app.submitted_at).toLocaleDateString()} | 
                              Updated: {new Date(app.last_updated_at).toLocaleDateString()}
                            </div>
                          </div>

                          {/* Notes - Compact */}
                          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/50">
                            <div className="text-xs font-semibold text-slate-600 mb-1">NOTES</div>
                            <div className="text-xs text-slate-700 truncate">
                              <EditableField 
                                app={app} 
                                field="agent_notes" 
                                value={app.agent_notes || "No notes"} 
                                placeholder="Add notes..."
                              /> • Agent: {app.agent_id}
                            </div>
                          </div>

                          {/* Quick Stats - Compact */}
                          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/50">
                            <div className="text-xs font-semibold text-slate-600 mb-1">QUICK STATS</div>
                            <div className="text-xs text-slate-700">
                              Processing: {Math.floor((new Date().getTime() - new Date(app.submitted_at).getTime()) / (1000 * 60 * 60 * 24))} days | 
                              Margin: {Math.round(((app.fees - app.costs) / app.fees) * 100)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 