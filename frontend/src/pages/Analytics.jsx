import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, BarChart3, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../api';
import { formatKwh, formatBill } from '../utils/format';

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get('/api/usage/analytics');
        setAnalyticsData(response.data);
      } catch (err) {
        console.error('Failed to fetch analytics', err);
        setError('Failed to load analytics data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const dailyChartData = analyticsData?.daily?.labels.map((label, i) => ({
    name: label,
    kwh: analyticsData.daily.data[i]
  })) || [];

  const weeklyChartData = analyticsData?.weekly?.labels.map((label, i) => ({
    name: label,
    kwh: analyticsData.weekly.data[i]
  })) || [];

  const AnalyticsTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const kwh = payload[0].value;
      const cost = kwh * 6; // Simple estimate
      return (
        <div className="bg-slate-900/90 border border-slate-700 p-4 rounded-xl shadow-xl backdrop-blur-md">
          <p className="text-white font-bold mb-2">{label}</p>
          <div className="space-y-1">
            <p className="text-cyan-400 text-sm">
              <span className="text-slate-400">Usage: </span> 
              {formatKwh(kwh)}
            </p>
            <p className="text-emerald-400 text-sm">
              <span className="text-slate-400">Cost: </span> 
              {formatBill(cost)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen p-6 bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-white transition-colors duration-500">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Energy Analytics</h1>
          <p className="text-sm text-slate-500 mt-2">Deep dive into your consumption patterns</p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-cyan-500 mb-4" />
            <p className="text-slate-400 font-medium">Loading your energy data...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 p-6 rounded-2xl flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Error Loading Analytics</h3>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!isLoading && !error && analyticsData && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Daily Trends Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800/60 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-slate-700/60 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-cyan-500" />
                </div>
                <h2 className="text-xl font-bold">Last 7 Days (Daily)</h2>
              </div>
              
              <div className="h-72 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val.toFixed(1)} />
                    <Tooltip content={<AnalyticsTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                    <Bar dataKey="kwh" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Weekly Trends Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-800/60 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-slate-700/60 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <h2 className="text-xl font-bold">Weekly Trends</h2>
              </div>
              
              <div className="h-72 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val.toFixed(1)} />
                    <Tooltip content={<AnalyticsTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} />
                    <Bar dataKey="kwh" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

          </div>
        )}

      </div>
    </div>
  );
}
