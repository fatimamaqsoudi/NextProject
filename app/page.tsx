// This tells React that this component needs to run in the browser (client-side)
// because we're using interactive features like useState
"use client";

// Import React's useState hook to manage component state (data that can change)
import { useState } from "react";

// This is our main Dashboard component for visa application management
export default function Dashboard() {
  
  // ===== STATE MANAGEMENT =====
  // useState creates a piece of state called 'activeTab' with initial value "analytics"
  const [activeTab, setActiveTab] = useState("analytics");
  
  // Sample data for our visa application dashboard (hardcoded for agent "Jawed")
  // In a real app, this would come from Supabase
  const visaMetrics = [
    { 
      title: "Total Applications",
      value: "247",
      change: "+12",
      changePercent: "+5.1%",
      trend: "up",
      period: "This month"
    },
    { 
      title: "Pending Revenue", 
      value: "$18,450", 
      change: "+$2,100", 
      changePercent: "+12.8%", 
      trend: "up",
      period: "Awaiting approval"
    },
    { 
      title: "Success Rate", 
      value: "89.2%", 
      change: "+2.1%", 
      changePercent: "+2.4%", 
      trend: "up",
      period: "Last 30 days"
    },
    { 
      title: "Total Revenue", 
      value: "$45,230", 
      change: "+$5,670", 
      changePercent: "+14.3%", 
      trend: "up",
      period: "This month"
    },
  ];

  // Sample recent applications data
  const recentApplications = [
    { 
      id: 1, 
      name: "Ahmed Hassan", 
      destination: "Canada", 
      status: "Pending", 
      amount: "$850",
      submitted: "2 hours ago",
      flag: "🇨🇦"
    },
    { 
      id: 2, 
      name: "Sarah Khan", 
      destination: "Australia", 
      status: "Approved", 
      amount: "$1,200",
      submitted: "5 hours ago",
      flag: "🇦🇺"
    },
    { 
      id: 3, 
      name: "Omar Ali", 
      destination: "United Kingdom", 
      status: "Pending", 
      amount: "$950",
      submitted: "1 day ago",
      flag: "🇬🇧"
    },
    { 
      id: 4, 
      name: "Fatima Noor", 
      destination: "Germany", 
      status: "Approved", 
      amount: "$750",
      submitted: "2 days ago",
      flag: "🇩🇪"
    },
  ];

  // Sample top destinations data for the world map section
  const topDestinations = [
    { country: "Canada", applications: 67, percentage: 32, flag: "🇨🇦" },
    { country: "Australia", applications: 45, percentage: 22, flag: "🇦🇺" },
    { country: "United Kingdom", applications: 38, percentage: 18, flag: "🇬🇧" },
    { country: "Germany", applications: 31, percentage: 15, flag: "🇩🇪" },
    { country: "United States", applications: 28, percentage: 13, flag: "🇺🇸" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* ===== HEADER SECTION ===== */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Left side: Brand and Dashboard title */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">V</span>
                </div>
                <span className="ml-2 text-xl font-semibold text-gray-900">VisaFlow</span>
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            
            {/* Right side: Time filter and agent info */}
            <div className="flex items-center space-x-4">
              
              {/* Time period buttons */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                {["Today", "This Week", "This Month", "This Year"].map((period) => (
                  <button
                    key={period}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      period === "This Month"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
              
              {/* Search bar */}
              <div className="relative">
                <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Search applications..." 
                  className="pl-10 pr-4 py-2 w-64 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Agent info */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">Jawed</div>
                  <div className="text-xs text-gray-500">Travel Agent</div>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">J</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===== NAVIGATION TABS ===== */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: "analytics", label: "Analytics", icon: "📊" },
              { id: "entry", label: "New Application", icon: "➕" },
              { id: "customers", label: "Customers", icon: "👥" },
              { id: "reports", label: "Reports", icon: "📈" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ===== MAIN CONTENT AREA ===== */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        
        {/* ===== METRICS CARDS GRID ===== */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {visaMetrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              
              {/* Metric header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">{metric.title}</h3>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  metric.trend === 'up' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  <span className="mr-1">{metric.trend === 'up' ? '↗' : '↘'}</span>
                  {metric.changePercent}
                </div>
              </div>
              
              {/* Main value */}
              <div className="mb-2">
                <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                <div className="text-sm text-gray-500">{metric.change} {metric.period}</div>
              </div>
              
              {/* Mini trend line placeholder */}
              <div className="h-12 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
                <div className="text-xs text-blue-600 font-medium">📈 Trend visualization</div>
              </div>
            </div>
          ))}
        </div>

        {/* ===== CHARTS AND DATA SECTION ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* ===== MAIN CHART AREA ===== */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              
              {/* Chart header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Application Trends</h3>
                  <p className="text-sm text-gray-500">Monthly visa application volume</p>
                </div>
                
                {/* Chart controls */}
                <div className="flex items-center space-x-3">
                  <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Applications</option>
                    <option>Revenue</option>
                    <option>Success Rate</option>
                  </select>
                </div>
              </div>
              
              {/* Chart placeholder with better styling */}
              <div className="h-80 bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-lg border border-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Interactive Chart</h4>
                  <p className="text-sm text-gray-500">Real-time visa application analytics</p>
                  <p className="text-xs text-gray-400 mt-1">Chart library integration pending</p>
                </div>
              </div>
            </div>
          </div>

          {/* ===== RECENT APPLICATIONS ===== */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">View All</button>
              </div>
              
              {/* Applications list */}
              <div className="space-y-4">
                {recentApplications.map((app) => (
                  <div key={app.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    
                    {/* Country flag and avatar */}
                    <div className="flex-shrink-0 relative">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {app.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 text-lg">{app.flag}</div>
                    </div>
                    
                    {/* Application details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">{app.name}</p>
                        <p className="text-sm font-medium text-gray-900">{app.amount}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">{app.destination}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          app.status === 'Approved' 
                            ? 'bg-green-100 text-green-800'
                            : app.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{app.submitted}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ===== WORLD MAP AND DESTINATIONS SECTION ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ===== WORLD MAP AREA ===== */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Global Destinations</h3>
                  <p className="text-sm text-gray-500">Where your customers are traveling</p>
                </div>
                <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-2">
                  <span>📤</span>
                  <span>Export</span>
                </button>
              </div>
              
              {/* World map placeholder */}
              <div className="h-80 bg-gradient-to-br from-blue-50 via-white to-green-50 rounded-lg border border-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🌍</span>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Interactive World Map</h4>
                  <p className="text-sm text-gray-500">Click countries to see application details</p>
                  <p className="text-xs text-gray-400 mt-1">Map library integration pending</p>
                </div>
              </div>
            </div>
          </div>

          {/* ===== TOP DESTINATIONS ===== */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Destinations</h3>
              
              {/* Destinations list */}
              <div className="space-y-4">
                {topDestinations.map((dest, index) => (
                  <div key={dest.country} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{dest.flag}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{dest.country}</div>
                        <div className="text-xs text-gray-500">{dest.applications} applications</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{dest.percentage}%</div>
                      <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${dest.percentage * 2}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Show all button */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Show All Destinations →
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ===== DESIGN NOTES =====
// This dashboard now features:
// 1. Clean, light design inspired by TrendTide
// 2. Professional visa application metrics
// 3. Modern card-based layout
// 4. Interactive elements with hover states
// 5. Proper spacing and typography
// 6. Agent-specific branding (Jawed)
// 7. Visa-specific data structure
// 8. Placeholder areas for charts and world map integration
