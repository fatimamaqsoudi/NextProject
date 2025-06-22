// This tells React that this component needs to run in the browser (client-side)
// because we're using interactive features like useState
"use client";

// Import React's useState hook to manage component state (data that can change)
import { useState } from "react";

// This is our main Dashboard component - it's a function that returns JSX (HTML-like code)
export default function Dashboard() {
  
  // ===== STATE MANAGEMENT =====
  // useState creates a piece of state called 'activeTab' with initial value "overview"
  // setActiveTab is the function we use to update this state
  const [activeTab, setActiveTab] = useState("overview");

  // ===== DATA ARRAYS =====
  // This array contains our dashboard metrics - in a real app, this would come from an API
  const metrics = [
    { 
      title: "Total Revenue",        // What this metric measures
      value: "$45,231.89",          // The actual number/value
      change: "+20.1%",             // How much it changed (positive or negative)
      trend: "up"                   // Whether it's going up or down (for styling)
    },
    { title: "Active Users", value: "2,350", change: "+180.1%", trend: "up" },
    { title: "Conversion Rate", value: "3.24%", change: "-19%", trend: "down" },
    { title: "Total Orders", value: "12,234", change: "+201", trend: "up" },
  ];

  // This array contains recent user activity - also would come from an API in real apps
  const recentActivity = [
    { 
      id: 1,                        // Unique identifier for each activity
      user: "Alice Johnson",        // User's name
      action: "Made a purchase",    // What they did
      time: "2 minutes ago",        // When they did it
      amount: "$299.00"            // Optional: amount if it's a purchase
    },
    { id: 2, user: "Bob Smith", action: "Signed up", time: "5 minutes ago", amount: "" },
    { id: 3, user: "Carol Davis", action: "Updated profile", time: "10 minutes ago", amount: "" },
    { id: 4, user: "David Wilson", action: "Made a purchase", time: "15 minutes ago", amount: "$149.99" },
  ];

  // ===== COMPONENT RETURN (THE ACTUAL HTML/JSX) =====
  // Main container - full screen height with gray background
  // TailwindCSS classes: min-h-screen = minimum height 100% of screen
  // bg-gray-50 = light gray background, dark:bg-gray-900 = dark gray in dark mode
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      
      {/* ===== HEADER SECTION ===== */}
      {/* This is the top navigation bar */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        {/* Container to center content and limit max width */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Flexbox layout: space-between puts items at opposite ends */}
          <div className="flex justify-between items-center h-16">
            
            {/* Left side: Dashboard title */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            </div>
            
            {/* Right side: Action buttons and user avatar */}
            <div className="flex items-center space-x-4">
              
              {/* First action button (export/download icon) */}
              <button className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                {/* SVG icon - this creates the visual icon */}
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5zM12 6V2l3 3-3 3-3-3 3-3z" />
                </svg>
              </button>
              
              {/* Second action button (settings/gear icon) */}
              <button className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5V3h-5z" />
                </svg>
              </button>
              
              {/* User avatar (circular with user's initial) */}
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                A
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===== NAVIGATION TABS ===== */}
      {/* Sub-navigation under the header */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            
            {/* Loop through each tab and create a button */}
            {/* .map() creates a new array by running a function on each item */}
            {["overview", "analytics", "users", "settings"].map((tab) => (
              <button
                key={tab} // React needs a unique 'key' for each item in a list
                onClick={() => setActiveTab(tab)} // When clicked, update the activeTab state
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  // Conditional styling: if this tab is active, show blue border and text
                  activeTab === tab
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"      // Active tab styling
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"  // Inactive tab styling
                }`}
              >
                {/* Display the tab name with first letter capitalized */}
                {tab}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ===== MAIN CONTENT AREA ===== */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* ===== METRICS CARDS GRID ===== */}
          {/* Grid layout: 1 column on mobile, 2 on small screens, 4 on large screens */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            
            {/* Loop through each metric and create a card */}
            {metrics.map((metric, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-xl">
                <div className="p-6">
                  <div className="flex items-center">
                    
                    {/* Icon container - color changes based on trend (up=green, down=red) */}
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                        metric.trend === 'up' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        
                        {/* Show different arrow based on trend */}
                        {metric.trend === 'up' ? (
                          /* Up arrow for positive trends */
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          /* Down arrow for negative trends */
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    
                    {/* Text content area */}
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        {/* Metric title (like "Total Revenue") */}
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          {metric.title}
                        </dt>
                        
                        {/* Metric value and change */}
                        <dd className="flex items-baseline">
                          {/* Main value (like "$45,231.89") */}
                          <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {metric.value}
                          </div>
                          
                          {/* Change percentage - color depends on trend */}
                          <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                            metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {metric.change}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ===== CHARTS AND ACTIVITY SECTION ===== */}
          {/* Two-column layout: chart takes 2/3 width, activity takes 1/3 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* ===== LEFT SIDE: CHART AREA ===== */}
            <div className="lg:col-span-2"> {/* Takes up 2 columns out of 3 */}
              <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
                
                {/* Chart header with title and dropdown */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Revenue Analytics</h3>
                  
                  {/* Time period selector dropdown */}
                  <select className="block w-32 text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option>Last 7 days</option>
                    <option>Last 30 days</option>
                    <option>Last 90 days</option>
                  </select>
                </div>
                
                {/* Chart placeholder - in a real app, you'd put a chart library here */}
                <div className="h-80 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-700 dark:to-gray-600 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    {/* Chart icon */}
                    <svg className="w-16 h-16 text-blue-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-gray-600 dark:text-gray-300">Interactive Chart Visualization</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Data visualization component goes here</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== RIGHT SIDE: RECENT ACTIVITY ===== */}
            <div className="lg:col-span-1"> {/* Takes up 1 column out of 3 */}
              <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Recent Activity</h3>
                
                {/* Activity list */}
                <div className="space-y-4"> {/* space-y-4 adds vertical spacing between items */}
                  
                  {/* Loop through each activity */}
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      
                      {/* User avatar (first letter of their name) */}
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-300 text-sm font-medium">
                            {activity.user.charAt(0)} {/* Gets first letter of user's name */}
                          </span>
                        </div>
                      </div>
                      
                      {/* Activity details */}
                      <div className="flex-1 min-w-0">
                        {/* User name */}
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.user}
                        </p>
                        
                        {/* What they did + amount if it's a purchase */}
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {activity.action}
                          {/* Only show amount if it exists (using && conditional rendering) */}
                          {activity.amount && (
                            <span className="font-medium text-green-600 dark:text-green-400 ml-1">
                              {activity.amount}
                            </span>
                          )}
                        </p>
                        
                        {/* When it happened */}
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* "View all" button */}
                <div className="mt-6">
                  <button className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                    View all activity
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ===== QUICK ACTIONS SECTION ===== */}
          <div className="mt-8">
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Quick Actions</h3>
              
              {/* Grid of action buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Array of actions with their info */}
                {[
                  { title: "Add User", icon: "👥", color: "blue" },
                  { title: "Generate Report", icon: "📊", color: "green" },
                  { title: "Send Message", icon: "💬", color: "purple" },
                  { title: "Export Data", icon: "📤", color: "orange" },
                ].map((action, index) => (
                  
                  /* Each action button */
                  <button
                    key={index}
                    /* Note: The dynamic color classes might not work in TailwindCSS v4 */
                    /* In a real project, you'd define these colors properly */
                    className="p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
                  >
                    <div className="text-center">
                      {/* Emoji icon */}
                      <div className="text-2xl mb-2">{action.icon}</div>
                      {/* Action title */}
                      <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600">
                        {action.title}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ===== KEY CONCEPTS EXPLAINED =====

// 1. COMPONENTS: Functions that return JSX (HTML-like code)
// 2. STATE: Data that can change (like activeTab)
// 3. PROPS: Data passed between components
// 4. MAP: Creates a list of items from an array
// 5. CONDITIONAL RENDERING: Show different things based on conditions (like trend up/down)
// 6. EVENT HANDLERS: Functions that run when user interacts (like onClick)
// 7. TAILWIND CSS: Utility classes for styling (like bg-white, text-lg, etc.)
// 8. RESPONSIVE DESIGN: Different layouts for different screen sizes (sm:, lg:, etc.)
