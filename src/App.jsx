import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { RoleProvider, ROLES } from './auth/RoleContext';
import { RequireRole } from './auth/RequireRole';
import { ENV } from './config/env';
import { BUSINESS } from './config/business';

import Dashboard from './pages/Dashboard';
import JobsList from './pages/JobsList';
import JobDetail from './pages/JobDetail';
import JobForm from './pages/JobForm';
import Employees from './pages/Employees';
import Calendar from './pages/Calendar';
import QuotesList from './pages/QuotesList';
import QuoteDetail from './pages/QuoteDetail';
import QuoteForm from './pages/QuoteForm';
import InvoicesList from './pages/InvoicesList';
import InvoiceForm from './pages/InvoiceForm';
import InvoiceDetail from './pages/InvoiceDetail';
import TimeSheet from './pages/TimeSheet';

function adminOnly(element) {
  return <RequireRole role={ROLES.ADMIN}>{element}</RequireRole>;
}

function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      {mobileOpen && <Sidebar mobile onClose={() => setMobileOpen(false)} />}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <MobileHeader onMenu={() => setMobileOpen(true)} />
        <Routes>
          <Route path="/"               element={adminOnly(<Dashboard />)} />
          <Route path="/jobs"           element={<JobsList />} />
          <Route path="/jobs/new"       element={adminOnly(<JobForm />)} />
          <Route path="/jobs/:id"       element={<JobDetail />} />
          <Route path="/jobs/:id/edit"  element={adminOnly(<JobForm />)} />
          <Route path="/quotes"         element={adminOnly(<QuotesList />)} />
          <Route path="/quotes/new"     element={adminOnly(<QuoteForm />)} />
          <Route path="/quotes/:id"     element={adminOnly(<QuoteDetail />)} />
          <Route path="/quotes/:id/edit"   element={adminOnly(<QuoteForm />)} />
          <Route path="/invoices"          element={adminOnly(<InvoicesList />)} />
          <Route path="/invoices/new"      element={adminOnly(<InvoiceForm />)} />
          <Route path="/invoices/:id"      element={adminOnly(<InvoiceDetail />)} />
          <Route path="/invoices/:id/edit" element={adminOnly(<InvoiceForm />)} />
          <Route path="/timesheet"      element={adminOnly(<TimeSheet />)} />
          <Route path="/employees"      element={adminOnly(<Employees />)} />
          <Route path="/calendar"       element={<Calendar />} />
        </Routes>
      </main>
    </div>
  );
}

function MobileHeader({ onMenu }) {
  return (
    <div className="md:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-[#E0DED8] px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[#E8611A] flex items-center justify-center">
          <span className="text-white font-bold text-xs">{BUSINESS.shortCode}</span>
        </div>
        <span className="font-bold text-sm text-[#1A1A18]">{BUSINESS.name}</span>
      </div>
      <button
        onClick={onMenu}
        aria-label="Open menu"
        className="w-8 h-8 rounded-xl bg-[#F5F4F0] flex items-center justify-center text-[#1A1A18]"
      >
        ☰
      </button>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={ENV.basePath}>
      <RoleProvider>
        <Layout />
      </RoleProvider>
    </BrowserRouter>
  );
}
