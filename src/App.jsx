import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import JobsList from './pages/JobsList';
import JobDetail from './pages/JobDetail';
import JobForm from './pages/JobForm';
import Employees from './pages/Employees';
import Calendar from './pages/Calendar';

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
          <Route path="/" element={<Dashboard />} />
          <Route path="/jobs" element={<JobsList />} />
          <Route path="/jobs/new" element={<JobForm />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/jobs/:id/edit" element={<JobForm />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/calendar" element={<Calendar />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
