import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';

import Landing from './pages/Landing';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import AIAssistant from './pages/AIAssistant';
import ComingSoon from './pages/ComingSoon';
import Appliances from './pages/Appliances';
import Automations from './pages/Automations';
import SidebarLayout from './components/layout/SidebarLayout';

function ProtectedRoute({ children, requireOnboarded = true }) {
  const { token, user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-cyan-500">Loading...</div>;
  if (!token) return <Navigate to="/" />;
  
  // If user is NOT onboarded, but tries to access a route that requires onboarding (like Dashboard)
  if (requireOnboarded && user && !user.is_onboarded) {
      return <Navigate to="/onboarding" />;
  }
  
  // If user IS onboarded, but tries to access the onboarding page again
  if (!requireOnboarded && user && user.is_onboarded) {
      return <Navigate to="/dashboard" />;
  }
  
  return children;
}

function PublicRoute({ children }) {
    const { token, user, loading } = useAuth();
    if (loading) return <div className="min-h-screen bg-[#0b0f19]"></div>;
    
    if (token) {
        if (user && !user.is_onboarded) return <Navigate to="/onboarding" />;
        return <Navigate to="/dashboard" />;
    }
    
    return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <Toaster position="top-right" />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

            {/* Protected Onboarding */}
            <Route path="/onboarding" element={<ProtectedRoute requireOnboarded={false}><Onboarding /></ProtectedRoute>} />

            {/* Protected Dashboard Routes with Sidebar Layout */}
            <Route element={<ProtectedRoute requireOnboarded={true}><SidebarLayout /></ProtectedRoute>}>
               <Route path="/dashboard" element={<Dashboard />} />
               <Route path="/settings" element={<Settings />} />
               <Route path="/analytics" element={<Analytics />} />
               <Route path="/ai-assistant" element={<AIAssistant />} />
               <Route path="/appliances" element={<Appliances />} />
               <Route path="/automations" element={<Automations />} />
            </Route>
            
            {/* Catch All Redirect */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}