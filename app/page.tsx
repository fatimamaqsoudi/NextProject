"use client";

import { useState, useEffect } from "react";
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Line,
  Bar
} from 'recharts';
import { dbFunctions, VisaApplication } from '../lib/supabase';
import DashboardLayout, { TimePeriod } from '../components/DashboardLayout';
import { downloadCSV } from '../utils/exportCsv';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('Month');
  
  const [analytics, setAnalytics] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [allApplications, setAllApplications] = useState<VisaApplication[]>([]);
  const [prevAnalytics, setPrevAnalytics] = useState<any>(null);
  const [activeSeries, setActiveSeries] = useState<'all' | 'applications' | 'revenue' | 'success'>('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (allApplications.length > 0) {
      filterDataByTimePeriod();
    }
  }, [timePeriod, allApplications]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [analyticsData, monthlyAnalytics, applicationsData] = await Promise.all([
        dbFunctions.getAnalytics(),
        dbFunctions.getMonthlyAnalytics(),
        dbFunctions.getApplications()
      ]);
      
      setAnalytics(analyticsData);
      setMonthlyData(monthlyAnalytics || []);
      setAllApplications(applicationsData || []);
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please check your Supabase configuration.');
    } finally {
      setLoading(false);
    }
  };

  const computeAnalytics = (apps: VisaApplication[]) => {
    const totalApplications = apps.length;
    const approvedCount = apps.filter(app => app.application_status === 'APPROVED').length;
    const pendingCount = apps.filter(app => app.application_status === 'PENDING').length;
    const rejectedCount = apps.filter(app => app.application_status === 'REJECTED').length;
    const totalRevenue = apps
      .filter(app => app.application_status === 'APPROVED')
      .reduce((sum, app) => sum + (app.fees - app.costs), 0);
    const pendingRevenue = apps
      .filter(app => app.application_status === 'PENDING')
      .reduce((sum, app) => sum + (app.fees - app.costs), 0);
    const successRate = totalApplications > 0 ? Math.round((approvedCount / totalApplications) * 100) : 0;

    return {
      totalApplications,
      approvedCount,
      pendingCount,
      rejectedCount,
      totalRevenue,
      pendingRevenue,
      successRate
    };
  };

  const filterDataByTimePeriod = () => {
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
    const filteredApps = allApplications.filter(app => 
      new Date(app.submitted_at) >= startDate
    );

    // === PREVIOUS PERIOD CALCULATION ===
    let prevStartDate: Date;
    let prevEndDate: Date = startDate; // end is start of current period
    switch (timePeriod) {
      case 'Today':
        prevStartDate = new Date(startDate.getTime() - 1 * 24 * 60 * 60 * 1000);
        break;
      case 'Week':
        prevStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'Month': {
        const d = new Date(startDate);
        d.setMonth(d.getMonth() - 1);
        prevStartDate = d;
        break;
      }
      case 'Year': {
        const d = new Date(startDate);
        d.setFullYear(d.getFullYear() - 1);
        prevStartDate = d;
        break;
      }
      default:
        prevStartDate = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const prevApps = allApplications.filter(app => {
      const date = new Date(app.submitted_at);
      return date >= prevStartDate && date < prevEndDate;
    });

    const prev = computeAnalytics(prevApps);
    setPrevAnalytics(prev);

    // Calculate analytics for filtered data
    const totalApplications = filteredApps.length;
    const approvedCount = filteredApps.filter(app => app.application_status === 'APPROVED').length;
    const pendingCount = filteredApps.filter(app => app.application_status === 'PENDING').length;
    const rejectedCount = filteredApps.filter(app => app.application_status === 'REJECTED').length;
    
    const totalRevenue = filteredApps
      .filter(app => app.application_status === 'APPROVED')
      .reduce((sum, app) => sum + (app.fees - app.costs), 0);
    
    const pendingRevenue = filteredApps
      .filter(app => app.application_status === 'PENDING')
      .reduce((sum, app) => sum + (app.fees - app.costs), 0);
    
    const successRate = totalApplications > 0 
      ? Math.round((approvedCount / totalApplications) * 100) 
      : 0;

    // Update analytics with current data
    const current = {
      totalApplications,
      approvedCount,
      pendingCount,
      rejectedCount,
      totalRevenue,
      pendingRevenue,
      successRate
    };

    setAnalytics(current);
  };

  const handleTimeFilterChange = (period: TimePeriod) => {
    setTimePeriod(period);
  };

  const periodLabelMap: Record<TimePeriod, string> = {
    Today: 'vs Yesterday',
    Week: 'vs last week',
    Month: 'vs last month',
    Year: 'vs last year'
  };

  const visaMetrics = analytics && prevAnalytics ? [
    {
      title: 'Total Applications',
      value: analytics.totalApplications.toString(),
      change: `${analytics.totalApplications - prevAnalytics.totalApplications}`,
      changePercent: prevAnalytics.totalApplications ? `${(((analytics.totalApplications - prevAnalytics.totalApplications) / prevAnalytics.totalApplications) * 100).toFixed(1)}%` : '—',
      trend: analytics.totalApplications - prevAnalytics.totalApplications >= 0 ? 'up' : 'down',
      period: periodLabelMap[timePeriod],
      icon: 'applications'
    },
    {
      title: 'Pending Revenue',
      value: `$${analytics.pendingRevenue.toLocaleString()}`,
      change: `$${(analytics.pendingRevenue - prevAnalytics.pendingRevenue).toLocaleString()}`,
      changePercent: prevAnalytics.pendingRevenue ? `${(((analytics.pendingRevenue - prevAnalytics.pendingRevenue) / prevAnalytics.pendingRevenue) * 100).toFixed(1)}%` : '—',
      trend: analytics.pendingRevenue - prevAnalytics.pendingRevenue >= 0 ? 'up' : 'down',
      period: 'Awaiting approval',
      icon: 'revenue'
    },
    {
      title: 'Success Rate',
      value: `${analytics.successRate}%`,
      change: `${analytics.successRate - prevAnalytics.successRate >= 0 ? '+' : ''}${analytics.successRate - prevAnalytics.successRate}%`,
      changePercent: '—',
      trend: analytics.successRate - prevAnalytics.successRate >= 0 ? 'up' : 'down',
      period: periodLabelMap[timePeriod],
      icon: 'success'
    },
    {
      title: 'Total Profit',
      value: `$${analytics.totalRevenue.toLocaleString()}`,
      change: `$${(analytics.totalRevenue - prevAnalytics.totalRevenue).toLocaleString()}`,
      changePercent: prevAnalytics.totalRevenue ? `${(((analytics.totalRevenue - prevAnalytics.totalRevenue) / prevAnalytics.totalRevenue) * 100).toFixed(1)}%` : '—',
      trend: analytics.totalRevenue - prevAnalytics.totalRevenue >= 0 ? 'up' : 'down',
      period: periodLabelMap[timePeriod],
      icon: 'total'
    }
  ] : [];

  // Status data for pie chart
  const statusData = analytics ? [
    { name: 'APPROVED', value: analytics.approvedCount, color: '#10B981' },
    { name: 'PENDING', value: analytics.pendingCount, color: '#F59E0B' },
    { name: 'REJECTED', value: analytics.rejectedCount, color: '#EF4444' }
  ] : [];

  const Icons = {
    applications: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    revenue: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    ),
    success: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    total: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    export: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
      </svg>
    )
  };

  const getMetricIcon = (iconType: string) => {
    return Icons[iconType as keyof typeof Icons] || Icons.applications;
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
  return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-semibold text-slate-900">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (!monthlyData.length) return <div className="flex items-center justify-center h-80 text-slate-500">No data available</div>;
    
    return (
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={monthlyData}>
          <defs>
            <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
          <YAxis yAxisId="left" stroke="#64748B" fontSize={12} />
          <YAxis yAxisId="right" orientation="right" stroke="#8B5CF6" domain={[0,100]} fontSize={12}/>
          <Tooltip content={<CustomTooltip />} />
          { (activeSeries === 'all' || activeSeries === 'applications') && (
            <Bar yAxisId="left" dataKey="applications" fill="url(#colorApplications)" barSize={24} radius={[4,4,0,0]} />
          )}
          { (activeSeries === 'all' || activeSeries === 'revenue') && (
            <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
          )}
          { (activeSeries === 'all' || activeSeries === 'success') && (
            <Line yAxisId="right" type="monotone" dataKey="successRate" stroke="#8B5CF6" strokeWidth={3} dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 5 }} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  // Export analytics data to CSV (uses monthlyData array)
  const handleExport = () => {
    if (monthlyData.length === 0) {
      alert('No data to export.');
      return;
    }
    downloadCSV(`analytics_${timePeriod.toLowerCase()}.csv`, monthlyData);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading analytics...</p>
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
    <DashboardLayout onTimeFilterChange={handleTimeFilterChange} defaultTimePeriod="Month">
      <div className="bg-slate-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* ===== METRICS CARDS GRID ===== */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {visaMetrics.map((metric, index) => (
              <div key={index} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300 group">
                
                {/* Metric header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-200">
                      {getMetricIcon(metric.icon)}
                    </div>
                    <h3 className="text-sm font-medium text-slate-600">{metric.title}</h3>
                  </div>
                  <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                    metric.trend === 'up' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    <svg className={`w-3 h-3 mr-1 ${metric.trend === 'up' ? 'rotate-0' : 'rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    {metric.changePercent}
                  </div>
                </div>
                
                {/* Main value */}
                <div className="mb-4">
                  <div className="text-3xl font-bold text-slate-900 mb-1">{metric.value}</div>
                  <div className="text-sm text-slate-500">{metric.change} {metric.period}</div>
                </div>
                
                {/* Mini trend visualization */}
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full w-3/4 transition-all duration-500"></div>
                </div>
              </div>
            ))}
          </div>

          {/* ===== CHARTS AND DATA SECTION ===== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* ===== MAIN CHART AREA ===== */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                
                {/* Chart header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">Application Analytics</h3>
                    <p className="text-sm text-slate-500">Interactive data visualization</p>
                  </div>
                  
                  {/* Legend & Export */}
                  <div className="flex items-center space-x-6">
                    {/* Legend */}
                    <div className="flex items-center space-x-4">
                      <div onClick={() => setActiveSeries(prev => prev==='applications' ? 'all' : 'applications')} className="flex items-center space-x-1 cursor-pointer select-none">
                        <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block"></span>
                        <span className="text-xs text-slate-600">Applications</span>
                      </div>
                      <div onClick={() => setActiveSeries(prev => prev==='revenue' ? 'all' : 'revenue')} className="flex items-center space-x-1 cursor-pointer select-none">
                        <span className="w-3 h-3 rounded-sm bg-green-500 inline-block"></span>
                        <span className="text-xs text-slate-600">Revenue</span>
                      </div>
                      <div onClick={() => setActiveSeries(prev => prev==='success' ? 'all' : 'success')} className="flex items-center space-x-1 cursor-pointer select-none">
                        <span className="w-3 h-3 rounded-sm bg-purple-500 inline-block"></span>
                        <span className="text-xs text-slate-600">Success %</span>
                      </div>
                    </div>
                    <button onClick={handleExport} className="p-2 text-slate-400 hover:text-slate-600 transition-colors" title="Export CSV">
                      {Icons.export}
                    </button>
                  </div>
                </div>
                
                {/* Beautiful Interactive Chart */}
                <div className="h-80">
                  {renderChart()}
                </div>
              </div>
            </div>

            {/* ===== STATUS BREAKDOWN PIE CHART ===== */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-6">Application Status</h3>
                {statusData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center space-x-4 mt-4">
                      {statusData.map((entry, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                          <span className="text-xs text-slate-600">{entry.name}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-48 text-slate-500">
                    No data available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
    </div>
    </DashboardLayout>
  );
}
