"use client";

import { useState, useEffect } from "react";
import { dbFunctions, VisaApplication } from '../lib/supabase';
import DashboardLayout from './DashboardLayout';

export default function AllApplicationsPage() {
  const [applications, setApplications] = useState<VisaApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [editingRows, setEditingRows] = useState<Set<number>>(new Set());
  const [editingField, setEditingField] = useState<{appId: number, field: string} | null>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await dbFunctions.getApplications();
      setApplications(data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort applications
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
    if (!confirm('Are you sure you want to delete this application?')) return;
    
    try {
      await dbFunctions.deleteApplication(id);
      await loadApplications();
      alert('Application deleted successfully!');
    } catch (err) {
      console.error('Error deleting application:', err);
      alert('Failed to delete application. Please try again.');
    }
  };

  // Toggle edit mode for a row
  const toggleEditMode = (appId: number) => {
    const newEditingRows = new Set(editingRows);
    if (newEditingRows.has(appId)) {
      newEditingRows.delete(appId);
    } else {
      newEditingRows.add(appId);
    }
    setEditingRows(newEditingRows);
    setEditingField(null);
  };

  // Handle field updates
  const handleFieldUpdate = async (appId: number, field: string, value: string | number) => {
    try {
      const updateData: any = {};
      
      // Handle different field types
      if (field === 'fees' || field === 'costs') {
        updateData[field] = parseFloat(value as string) || 0;
      } else if (field === 'whatsapp_sent') {
        updateData[field] = value === '✓ Sent';
      } else if (field === 'gender') {
        // Convert short format back to full format for database
        const genderMap: {[key: string]: string} = {
          'M': 'Male',
          'F': 'Female', 
          'O': 'Other',
          'N/A': 'Not specified'
        };
        updateData[field] = genderMap[value as string] || value;
      } else {
        updateData[field] = value;
      }

      await dbFunctions.updateApplication(appId, updateData);
      await loadApplications();
      setEditingField(null);
    } catch (err) {
      console.error('Error updating field:', err);
      alert('Failed to update field. Please try again.');
    }
  };

  // Editable field component
  const EditableField = ({ 
    app, 
    field, 
    value, 
    type = 'text',
    options = null,
    className = "",
    placeholder = ""
  }: {
    app: VisaApplication,
    field: string,
    value: any,
    type?: 'text' | 'email' | 'tel' | 'date' | 'number' | 'select',
    options?: string[] | null,
    className?: string,
    placeholder?: string
  }) => {
    const isEditing = editingField?.appId === app.id && editingField?.field === field;
    const isRowEditable = editingRows.has(app.id);

    if (!isRowEditable) {
      return <span className={className}>{value}</span>;
    }

    if (isEditing) {
      if (type === 'select' && options) {
        return (
          <select
            value={value}
            onChange={(e) => handleFieldUpdate(app.id, field, e.target.value)}
            onBlur={() => setEditingField(null)}
            autoFocus
            className="bg-white border border-blue-300 rounded px-2 py-1 text-sm min-w-0 w-full"
          >
            {options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      }

      return (
        <input
          type={type}
          value={value}
          onChange={(e) => handleFieldUpdate(app.id, field, e.target.value)}
          onBlur={() => setEditingField(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setEditingField(null);
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
        {value || placeholder}
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
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    save: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
    )
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600 text-lg">Loading applications...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Enhanced Header Content */}
      <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 -mt-8 pt-8 -mx-8 px-8 mb-8 rounded-2xl border border-blue-200/50">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8 py-8">
          <div>
            <h1 className="text-4xl xl:text-5xl font-black text-slate-800 mb-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              All Applications
            </h1>
            <p className="text-slate-600 text-xl font-medium">
              Manage and track all visa applications • <span className="text-blue-600 font-bold">{filteredApplications.length}</span> total
            </p>
          </div>

          {/* Enhanced Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <div className="text-slate-500 group-focus-within:text-blue-500 transition-colors">{Icons.search}</div>
              </div>
              <input
                type="text"
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-4 w-full sm:w-80 bg-white/95 backdrop-blur-sm border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-slate-700 placeholder-slate-400 shadow-lg hover:shadow-xl font-medium"
              />
            </div>

            {/* Status Filter */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <div className="text-slate-500 group-focus-within:text-blue-500 transition-colors">{Icons.filter}</div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-12 pr-10 py-4 bg-white/95 backdrop-blur-sm border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-slate-700 appearance-none cursor-pointer shadow-lg hover:shadow-xl font-medium"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {/* Sort */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <div className="text-slate-500 group-focus-within:text-blue-500 transition-colors">{Icons.sort}</div>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-12 pr-10 py-4 bg-white/95 backdrop-blur-sm border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-slate-700 appearance-none cursor-pointer shadow-lg hover:shadow-xl font-medium"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A-Z</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-md rounded-3xl border-2 border-slate-200 p-16 text-center shadow-xl">
            <div className="text-slate-600 text-xl font-medium">
              {searchTerm || statusFilter !== "ALL" 
                ? "No applications match your filters" 
                : "No applications found"}
            </div>
          </div>
        ) : (
          filteredApplications.map((app) => {
            const statusInfo = getStatusBadge(app.application_status);
            const isEditing = editingRows.has(app.id);
            
            return (
              <div
                key={app.id}
                className={`bg-white/95 backdrop-blur-md rounded-2xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group ${
                  isEditing 
                    ? 'border-blue-400/70 ring-2 ring-blue-300/50' 
                    : 'border-slate-200/50 hover:border-blue-300/50'
                }`}
              >
                {/* Main Row - Consistent Sizing */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-20 gap-4 lg:gap-6 items-center">
                    
                    {/* Sequential Number - 1 col */}
                    <div className="lg:col-span-1">
                      <div className="text-center">
                        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto">
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
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleEditMode(app.id)}
                            className={`p-2 rounded-xl transition-all duration-300 hover:scale-110 ${
                              isEditing 
                                ? 'text-green-600 hover:text-white hover:bg-green-500 hover:shadow-lg hover:shadow-green-500/25' 
                                : 'text-blue-500 hover:text-white hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25'
                            }`}
                            title={isEditing ? "Save changes" : "Edit application"}
                          >
                            {isEditing ? Icons.save : Icons.edit}
                          </button>
                          
                          <button
                            onClick={() => handleDelete(app.id)}
                            className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-red-500/25"
                            title="Delete application"
                          >
                            {Icons.delete}
                          </button>
                        </div>
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
          })
        )}
      </div>
    </DashboardLayout>
  );
} 