import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Zap, Menu } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';

export default function SidebarLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
     return localStorage.getItem('sidebar_collapsed') !== 'true';
  });
  
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
     localStorage.setItem('sidebar_collapsed', !sidebarOpen);
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-white">
      
      {/* Mobile Top Navbar (moved here to keep layout clean) */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-[#0b0f19] border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white fixed top-0 w-full z-30">
        <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2">
           <Menu className="w-6 h-6" />
        </button>
        <div className="flex flex-1 justify-center items-center gap-2">
           <Zap className="w-6 h-6 text-cyan-500" />
           <span className="font-bold text-lg tracking-wide">VoltVision</span>
        </div>
        <ThemeToggle />
      </div>

      {/* Sidebar Wrapper */}
      <aside className={`
        fixed top-0 left-0 h-full z-40
        transition-all duration-300
        bg-white dark:bg-[#0b0f19] 
        border-r border-slate-200 dark:border-slate-800
        ${sidebarOpen ? 'w-64' : 'w-20'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <Sidebar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          setMobileOpen={setMobileOpen} 
        />
      </aside>

      {/* Main content - offset by sidebar width */}
      <main className={`
        flex-1 transition-all duration-300 w-full
        ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}
        pt-16 md:pt-0 min-h-screen overflow-x-hidden
      `}>
        <Outlet />
      </main>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </div>
  );
}
