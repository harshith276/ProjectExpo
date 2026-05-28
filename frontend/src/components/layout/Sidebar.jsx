import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Zap, LayoutDashboard, BarChart3, Bot, Home, Settings as SettingsIcon, Cable, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ sidebarOpen, setSidebarOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/ai-assistant', label: 'AI Assistant', icon: Bot },
    { path: '/appliances', label: 'Appliances', icon: Home },
    { path: '/automations', label: 'Automations', icon: Cable },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleLogout = () => {
     logout();
     navigate('/');
  };

  return (
    <div className="h-full flex flex-col text-slate-400 font-medium">
      {/* Sidebar Header */}
      <div className="h-16 md:h-20 flex items-center px-4 relative">
         <Zap className={`text-cyan-500 shrink-0 transition-all ${!sidebarOpen ? 'w-8 h-8 mx-auto' : 'w-8 h-8 mr-3'}`} />
         {sidebarOpen && <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">VoltVision AI</span>}
         
         {/* Collapse Toggle */}
         <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full items-center justify-center text-slate-700 dark:text-white hover:bg-cyan-50 dark:hover:bg-cyan-600 transition-colors z-50"
         >
            {sidebarOpen ? <ChevronLeft className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
         </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto overflow-x-hidden">
         {navLinks.map(link => (
            <NavLink 
               key={link.path} 
               to={link.path}
               onClick={() => setMobileOpen(false)}
               className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded-lg transition-all border-l-2 ${
                  isActive 
                  ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 border-cyan-500 shadow-[inset_0_0_20px_rgba(34,211,238,0.05)] dark:shadow-[inset_0_0_20px_rgba(34,211,238,0.1)]' 
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
               } ${!sidebarOpen ? 'justify-center border-l-0 px-0 relative group' : ''}`}
            >
              <link.icon className={`shrink-0 ${!sidebarOpen ? 'w-6 h-6' : 'w-5 h-5'}`} />
              {sidebarOpen && <span>{link.label}</span>}

              {/* Tooltip for collapsed mode */}
              {!sidebarOpen && (
                 <div className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                    {link.label}
                 </div>
              )}
            </NavLink>
         ))}
      </nav>

      {/* Footer Area */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
         {sidebarOpen && (
            <div className="mb-4 px-2">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Logged In As</div>
              <div className="text-sm font-bold text-slate-700 dark:text-white truncate">{user?.email}</div>
            </div>
         )}
         
         <button 
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-white transition-colors ${!sidebarOpen ? 'px-0' : 'px-4'}`}
         >
            <LogOut className="w-5 h-5 text-red-500 dark:text-red-400" />
            {sidebarOpen && <span>Logout</span>}
         </button>
      </div>
    </div>
  );
}
