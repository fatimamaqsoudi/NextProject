# VisaFlow - Travel Agent Dashboard

A modern, clean visa application management system for travel agents built with Next.js 15, TailwindCSS v4, and Supabase.

## 🎯 PROJECT CONTEXT

### **Business Overview**
VisaFlow is a comprehensive dashboard system designed for travel agents to manage visa applications for their customers. The system provides a clean, modern interface for tracking applications, managing customer data, analyzing revenue, and visualizing global destination trends.

### **Target Users**
- **Primary:** Travel agents who help customers with visa applications
- **Secondary:** Travel agency managers who need analytics and reporting

### **Core Functionality**
The system manages the complete visa application lifecycle from initial data entry through final approval/rejection, with full revenue tracking and analytics.

---

## 📋 TECHNICAL SPECIFICATIONS

### **Tech Stack**
- **Frontend:** Next.js 15.3.4 with TypeScript
- **Styling:** TailwindCSS v4 (clean, light modern design)
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth with Row Level Security (RLS)
- **Deployment:** Vercel

### **Database Schema**
**Table:** `visa_applications`
```sql
- id (uuid, primary key)
- first_name (text, required)
- middle_name (text, optional) 
- last_name (text, required)
- date_of_birth (date, required)
- passport_no (text, required)
- gender (text, optional)
- whatsapp_number (text, optional)
- visa_type (text, optional)
- application_status (text, required) // "Pending", "Approved", "Rejected"
- submitted_at (timestamptz, auto-generated)
- last_updated_at (timestamptz, auto-generated)
- document_urls (text, optional)
- agent_notes (text, optional)
- agent_id (text, required) // Links to authenticated agent
- fees (numeric, required) // Agent's fees charged to customer
- costs (numeric, required) // Agent's costs for processing
- whatsapp_sent (bool, optional)
- email (text, optional)
- destination (text, optional) // Country customer is traveling to
```

### **Business Logic**
- **Revenue Calculation:** Profit = fees - costs
- **Status Types:** "Pending", "Approved", "Rejected"
- **Agent Isolation:** Each agent sees only their own applications (RLS)

---

## 🏗️ APPLICATION ARCHITECTURE

### **4-Page Structure**

#### **1. Analytics Dashboard 
- **Purpose:** Main overview with KPIs and trends
- **Features:**
  - Metrics cards: Total Applications, Pending Revenue, Success Rate, Total Revenue
  - Application trends chart (monthly volume)
  - Recent applications list with status badges
  - Interactive world map showing destination countries
  - Top destinations with application counts
- **Design:** Clean, light TrendTide-inspired design with blue accents

#### **2. Data Entry Page 
- **Purpose:** Form to add new visa applications
- **Features:**
  - All required fields from database schema
  - Form validation (required vs optional fields)
  - Auto-populate agent_id and timestamps
  - File upload for documents
  - Success/error feedback

#### **3. Customers Page 
- **Purpose:** Comprehensive view of all applications
- **Features:**
  - Searchable/sortable table of all applications
  - Filter by status: "Done" (Approved), "In Progress" (Pending), "Rejected"
  - Pagination for large datasets
  - Quick status update actions
  - Export functionality

#### **4. Authentication 
- **Purpose:** Secure agent login
- **Features:**
  - Email/password authentication via Supabase Auth
  - Row Level Security ensuring agents see only their data
  - Agent profile management

---

## 🎨 DESIGN SYSTEM

### **Visual Design Language**
- **Theme:** Light, clean, modern (inspired by TrendTide dashboard)
- **Colors:** 
  - Primary: Blue (#3B82F6)
  - Background: White (#FFFFFF) and Light Gray (#F9FAFB)
  - Text: Gray scale (#111827, #6B7280, #9CA3AF)
  - Success: Green (#10B981)
  - Warning: Yellow (#F59E0B)
  - Error: Red (#EF4444)

### **Components**
- **Cards:** White background, subtle border, rounded corners, hover shadows
- **Buttons:** Blue primary, ghost secondary, proper focus states
- **Forms:** Clean inputs with proper validation states
- **Navigation:** Tab-based navigation with icons
- **Status Badges:** Color-coded for application status

---

## 🚀 IMPLEMENTATION ROADMAP

### **Phase 1: Foundation 
- [x] Project setup with Next.js 15 + TailwindCSS v4
- [x] Clean, modern analytics dashboard design
- [x] Sample data structure and components
- [x] Responsive layout system

### **Phase 2: Backend Integration
- [ ] Supabase project setup and configuration
- [ ] Database schema implementation
- [ ] Authentication system with RLS
- [ ] API routes for CRUD operations

### **Phase 3: Core Features 
- [ ] Data Entry page with form validation
- [ ] Customers page with filtering/search
- [ ] Real data integration (replace mock data)
- [ ] File upload for documents

### **Phase 4: Advanced Features 
- [ ] Interactive world map integration
- [ ] Real-time charts and analytics
- [ ] Email/WhatsApp notifications
- [ ] Advanced reporting and exports
- [ ] Multi-agent management features

---

---

## 🔐 SECURITY CONSIDERATIONS

- **Row Level Security (RLS):** Agents can only access their own applications
- **Authentication:** Secure email/password login via Supabase
- **Data Validation:** Both client and server-side validation
- **File Security:** Secure document upload with proper access controls

---

## 📊 SUCCESS METRICS

- **User Experience:** Clean, intuitive interface for travel agents
- **Performance:** Fast loading and responsive design
- **Security:** Proper data isolation between agents
- **Scalability:** Support for multiple agents and thousands of applications
- **Analytics:** Comprehensive insights into application trends and revenue

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
