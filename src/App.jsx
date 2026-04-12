import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
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
import { RoleProvider, useRole } from './context/RoleContext';

function AdminRoute({ children }) {
  const { role } = useRole();
  if (role !== 'admin') return <Navigate to="/calendar" replace />;
  return children;
}

function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      {mobileOpen && <Sidebar mobile onClose={() => setMobileOpen(false)} />}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="md:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-[#E0DED8] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#E8611A] flex items-center justify-center">
              <span className="text-white font-bold text-xs">PM</span>
            </div>
            <span className="font-bold text-sm text-[#1A1A18]">PaveMaster</span>
          </div>
          <button onClick={() => setMobileOpen(true)} className="w-8 h-8 rounded-xl bg-[#F5F4F0] flex items-center justify-center text-[#1A1A18]">
            ☰
          </button>
        </div>
        <Routes>
          <Route path="/" element={<AdminRoute><Dashboard /></AdminRoute>} />
          <Route path="/jobs" element={<JobsList />} />
          <Route path="/jobs/new" element={<AdminRoute><JobForm /></AdminRoute>} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/jobs/:id/edit" element={<AdminRoute><JobForm /></AdminRoute>} />
          <Route path="/quotes" element={<AdminRoute><QuotesList /></AdminRoute>} />
          <Route path="/quotes/new" element={<AdminRoute><QuoteForm /></AdminRoute>} />
          <Route path="/quotes/:id" element={<AdminRoute><QuoteDetail /></AdminRoute>} />
          <Route path="/quotes/:id/edit" element={<AdminRoute><QuoteForm /></AdminRoute>} />
          <Route path="/invoices" element={<AdminRoute><InvoicesList /></AdminRoute>} />
          <Route path="/invoices/new" element={<AdminRoute><InvoiceForm /></AdminRoute>} />
          <Route path="/invoices/:id" element={<AdminRoute><InvoiceDetail /></AdminRoute>} />
          <Route path="/invoices/:id/edit" element={<AdminRoute><InvoiceForm /></AdminRoute>} />
          <Route path="/timesheet" element={<AdminRoute><TimeSheet /></AdminRoute>} />
          <Route path="/employees" element={<AdminRoute><Employees /></AdminRoute>} />
          <Route path="/calendar" element={<Calendar />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/ant">
      <RoleProvider>
        <Layout />
      </RoleProvider>
    </BrowserRouter>
  );
}
