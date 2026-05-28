import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip,
  Filler, Legend
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import {
  Zap, Activity, BarChart2, IndianRupee,
  Snowflake, Flame, Monitor, ChefHat,
  AlertTriangle, CheckCircle2, WifiOff
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { formatWatts, formatKwh, formatBudget, formatBill, formatPercent } from '../utils/format';

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip,
  Filler, Legend
);

// ₹ per kWh — Indian average rate
const INR_RATE_PER_KWH = 6.0;

// Calculate slab bill in ₹ for a given state
const STATE_SLABS = {
  "Tamil Nadu": [
    [100, 0.00],
    [200, 1.50],
    [500, 3.00],
    [Infinity, 5.00]
  ],
  "Karnataka": [
    [30, 3.15],
    [100, 5.55],
    [200, 6.45],
    [Infinity, 7.65]
  ],
  "Maharashtra": [
    [100, 3.46],
    [300, 6.57],
    [Infinity, 9.86]
  ],
  "Delhi": [
    [200, 3.00],
    [400, 4.50],
    [Infinity, 6.50]
  ],
  "Andhra Pradesh": [
    [50, 1.45],
    [100, 2.60],
    [200, 3.76],
    [Infinity, 5.00]
  ],
  "Telangana": [
    [50, 1.45],
    [100, 2.60],
    [200, 3.76],
    [Infinity, 5.00]
  ],
  "Kerala": [
    [40, 2.20],
    [80, 3.25],
    [150, 4.50],
    [Infinity, 6.50]
  ],
  "Gujarat": [
    [50, 2.85],
    [200, 4.75],
    [Infinity, 6.00]
  ],
  "Rajasthan": [
    [50, 3.00],
    [150, 4.75],
    [300, 6.00],
    [Infinity, 7.00]
  ],
  "West Bengal": [
    [75, 4.48],
    [150, 5.87],
    [250, 6.72],
    [Infinity, 7.62]
  ],
  "Uttar Pradesh": [
    [100, 3.35],
    [150, 4.50],
    [300, 5.50],
    [Infinity, 6.00]
  ]
}

function calculateSlabBill(units, state) {
  const slabs = STATE_SLABS[state] 
             || STATE_SLABS["Tamil Nadu"]
  let total = 0
  let prev = 0
  let remaining = units
  let currentSlab = 1
  let currentRate = 0
  let slabIndex = 0

  for (const [limit, rate] of slabs) {
    slabIndex++
    if (remaining <= 0) break
    const slabMax = limit === Infinity 
      ? prev + remaining 
      : limit
    const slabUnits = Math.min(
      remaining, slabMax - prev
    )
    total += slabUnits * rate
    remaining -= slabUnits
    currentSlab = slabIndex
    currentRate = rate
    prev = limit === Infinity ? prev : limit
  }

  return {
    total: Math.round(total * 100) / 100,
    currentSlab,
    currentRate
  }
}

function getSlabLabel(slab, rate, state) {
  const slabs = STATE_SLABS[state] || STATE_SLABS["Tamil Nadu"];
  let prev = 0;
  for (let i = 0; i < slab - 1; i++) {
    prev = slabs[i][0] === Infinity ? prev : slabs[i][0];
  }
  const limit = slabs[slab - 1]?.[0];
  const range = limit === Infinity ? `${prev}+ units` : `${prev}–${limit} units`;
  return {
    range,
    label: rate === 0 ? 'Free Tier' : `₹${rate.toFixed(2)}/unit`,
  };
}

export default function Dashboard() {
  const { user } = useAuth();

  // Real-time state — seeded from sessionStorage to prevent flash-of-zeros on navigation
  const [currentWatts, setCurrentWatts] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('vv_kpi') || 'null')?.currentWatts ?? 0; } catch { return 0; }
  });
  const [totalKwh, setTotalKwh] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('vv_kpi') || 'null')?.totalKwh ?? 0; } catch { return 0; }
  });
  const [todayKwh, setTodayKwh] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('vv_kpi') || 'null')?.todayKwh ?? 0; } catch { return 0; }
  });
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  // Chart state — seeded from sessionStorage to restore rolling history on navigation
  const [chartPoints, setChartPoints] = useState(() => {
    try {
      const saved = sessionStorage.getItem('vv_chart');
      return saved ? JSON.parse(saved) : { labels: [], watts: [] };
    } catch { return { labels: [], watts: [] }; }
  });

  // WebSocket state
  const wsRef = useRef(null);
  const [wsStatus, setWsStatus] = useState('connecting');

  // Appliance simulator — driven by the database (GET /api/appliances)
  const [appliances, setAppliances] = useState([]);
  const prevAppliancesRef = useRef([]);
  const lastAiWarningRef = useRef(null);

  useEffect(() => {
    prevAppliancesRef.current = appliances;
  }, [appliances]);

  // AI Watchdog: poll budget warning every 20s, avoid duplicate toasts
  useEffect(() => {
    let isMounted = true;

    const pollAiBudgetWarning = async () => {
      try {
        const res = await api.get('/api/ai/budget-warning');
        const warning = typeof res?.data?.warning === 'string'
          ? res.data.warning.trim()
          : null;

        if (!isMounted || !warning || warning === lastAiWarningRef.current) {
          return;
        }

        lastAiWarningRef.current = warning;
        toast(`🤖 ${warning}`, {
          duration: 6000,
          style: {
            borderRadius: '10px',
            background: '#581c87',
            color: '#f3e8ff',
            border: '1px solid #7e22ce',
          },
        });
      } catch (err) {
        console.error('Failed to fetch AI budget warning', err);
      }
    };

    pollAiBudgetWarning();
    const watchdogInterval = setInterval(pollAiBudgetWarning, 20000);

    return () => {
      isMounted = false;
      clearInterval(watchdogInterval);
    };
  }, []);

  // Usage history
  const [dailyData, setDailyData]   = useState({ labels: [], data: [], has_data: false });
  const [weeklyData, setWeeklyData] = useState({ labels: [], data: [], has_data: false });
  const [lastPolled, setLastPolled] = useState(null);

  // User settings from profile
  const budget    = user?.budget            || 2000;   // ₹ INR
  const unitLimit = user?.monthly_unit_limit || 200;   // kWh
  const userState = user?.state             || 'Tamil Nadu';


  // Sum watts of all currently active (is_active === true) appliances
  const totalExtraWatts = appliances
    .filter(a => a.is_active)
    .reduce((sum, a) => sum + a.watts, 0);

  // ── Initial data fetch ─────────────────────────────────
  useEffect(() => {
    async function fetchDashboardAppliances() {
      try {
        const apps = await api.get('/api/appliances/');
        const prevApps = prevAppliancesRef.current;

        if (prevApps.length > 0) {
          prevApps.forEach(oldApp => {
            const newApp = apps.data.find(a => a.id === oldApp.id);
            if (newApp && oldApp.is_active && !newApp.is_active) {
              toast(`⚠️ Automation Triggered: ${oldApp.name} was turned off to prevent overload.`, {
                duration: 6000,
                style: {
                  borderRadius: '10px',
                  background: '#1e293b',
                  color: '#fff',
                  border: '1px solid #334155',
                },
              });
            }
          });
        }
        
        setAppliances(apps.data);
      } catch(err){
        console.error("Failed to load appliances", err);
      }
    }
    fetchDashboardAppliances();
    const appInterval = setInterval(fetchDashboardAppliances, 5000);

    const fetchUsageHistory = async () => {
      try {
        const [daily, weekly] = await Promise.all([
          api.get('/api/usage/daily'),
          api.get('/api/usage/weekly'),
        ]);
        setDailyData(daily.data);
        setWeeklyData(weekly.data);
        if (daily.data.total_kwh_today !== undefined) {
          setTodayKwh(daily.data.total_kwh_today);
        }
        setLastPolled(new Date().toLocaleTimeString());
      } catch (err) {
        console.error("Failed to fetch usage history", err); // FIX 4: Added console.error
      }
    };
    fetchUsageHistory();
    const historyInterval = setInterval(fetchUsageHistory, 30000);
    
    return () => {
        clearInterval(appInterval);
        clearInterval(historyInterval);
    };
  }, []);

  // ── WebSocket connection ───────────────────────────────
  useEffect(() => {
    let reconnectTimer = null
    let reconnectCount = 0
    const maxReconnectAttempts = 5

    function connect() {
      reconnectCount++
      const wsUrl = `${
        import.meta.env.VITE_WS_BASE_URL 
        || 'ws://localhost:8000'
      }/ws/live-status`
      
      console.log(`[WS] Attempt ${reconnectCount}/${maxReconnectAttempts}: ${wsUrl}`)
      setWsStatus('connecting')
      
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[WS] ✅ Connected successfully')
        setWsStatus('connected')
        reconnectCount = 0  // Reset on success
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WS] 📊 Received:', data);

          // Update real-time stats — both todayKwh and totalKwh come from
          // data.total_kwh (the DB-backed ground truth for today's sum).
          // todayKwh must NEVER be manually accumulated on the frontend;
          // doing so causes drift when sessionStorage seeds a stale value.
          setCurrentWatts(data.current_watts || 0);
          setTotalKwh(data.total_kwh || 0);
          setTodayKwh(data.total_kwh || 0);
          setLastUpdateTime(data.timestamp);

          // Add to chart and persist updated history to sessionStorage
          setChartPoints(prev => {
            const newLabels = [...prev.labels, data.timestamp].slice(-30);
            const newWatts  = [...prev.watts,  data.current_watts].slice(-30);
            const newChart  = { labels: newLabels, watts: newWatts };
            sessionStorage.setItem('vv_chart', JSON.stringify(newChart));
            console.log('[Chart] Updated with', newWatts.length, 'points');
            return newChart;
          });

          // Persist KPI snapshot so the next mount shows last-known values
          sessionStorage.setItem('vv_kpi', JSON.stringify({
            currentWatts: data.current_watts || 0,
            totalKwh:     data.total_kwh     || 0,
            todayKwh:     data.total_kwh     || 0,
          }));
        } catch (e) {
          console.error('[WS] Parse error:', e);
        }
      };

      ws.onerror = (error) => {
        console.error('[WS] ❌ Error:', error)
        setWsStatus('error')
      }

      ws.onclose = () => {
        console.log(`[WS] Disconnected. Reconnect in 3s...`)
        setWsStatus('reconnecting')
        
        if (reconnectCount < maxReconnectAttempts) {
          reconnectTimer = setTimeout(connect, 3000)
        } else {
          console.error('[WS] Max reconnect attempts reached')
          setWsStatus('failed')
        }
      }
    }

    connect()
    
    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (wsRef.current) {
        wsRef.current.close()
        console.log('[WS] Closing connection on unmount')
      }
    }
  }, [])

  // ── Toggle appliance \u2014 calls the real API, syncs global state ─
  const toggleAppliance = async (id) => {
    // Optimistic update
    setAppliances(prev =>
      prev.map(a => a.id === id ? { ...a, is_active: !a.is_active } : a)
    );
    try {
      const res = await api.put(`/api/appliances/${id}/toggle`);
      // Confirm with server truth
      setAppliances(prev =>
        prev.map(a => a.id === id ? res.data : a)
      );
    } catch (err) {
      console.error('[Appliance] Toggle failed \u2014 reverting', err);
      // Revert optimistic update on error
      setAppliances(prev =>
        prev.map(a => a.id === id ? { ...a, is_active: !a.is_active } : a)
      );
    }
  };

  // ── Sync active appliance load to backend simulator ───
  // Fires whenever any appliance's is_active field changes.
  useEffect(() => {
    const totalWatts = appliances
      .filter(a => a.is_active)
      .reduce((sum, a) => sum + a.watts, 0);

    api.post('/api/simulator/set-load', { watts: totalWatts })
      .then(() => console.log(`[Simulator] \u26a1 Backend load synced \u2192 ${totalWatts}W`))
      .catch(err =>
        console.error('[Simulator] Failed to sync load to backend:', err)
      );
  }, [appliances]); // eslint-disable-line react-hooks/exhaustive-deps


  // ── Computed values (all in ₹ INR) ────────────────────
  const effectiveWatts    = currentWatts + totalExtraWatts;

  // Extra monthly cost from active appliances in ₹
  const extraMonthlyCostINR =
    (totalExtraWatts / 1000) * 6 * 30 * INR_RATE_PER_KWH;

  // Slab-based bill for today's kWh (projected to month)
  const monthlyKwhEstimate = todayKwh * 30;
  const slabResult = calculateSlabBill(monthlyKwhEstimate, userState);
  const projectedBillINR   = monthlyKwhEstimate * 6;
  const isOverBudget       = projectedBillINR > budget;
  const remaining          = budget - projectedBillINR;

  // Units progress bar
  const unitsPercent = Math.min(
    (monthlyKwhEstimate / unitLimit) * 100, 110
  );
  const barColor =
    unitsPercent >= 100 ? 'bg-red-500'    :
    unitsPercent >= 80  ? 'bg-yellow-500' :
                          'bg-emerald-500';

  // Current slab info
  const slab = getSlabLabel(
    slabResult.currentSlab,
    slabResult.currentRate,
    userState
  );

  // ── Chart config ───────────────────────────────────────
  const liveChartData = {
    labels: chartPoints.labels,
    datasets: [
      {
        label: 'Power Consumption (W)',
        data:  chartPoints.watts,
        borderColor: '#10b981',
        backgroundColor: (context) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) return 'transparent';
          const gradient = ctx.createLinearGradient(
            0, chartArea.top, 0, chartArea.bottom
          );
          gradient.addColorStop(0, 'rgba(16,185,129,0.35)');
          gradient.addColorStop(1, 'rgba(16,185,129,0.0)');
          return gradient;
        },
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointBackgroundColor:    '#10b981',
        pointBorderColor:        '#ffffff',
        pointBorderWidth:        2,
        pointRadius:             5,
        pointHoverRadius:        8,
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor:   '#10b981',
        pointHoverBorderWidth:   3,
      },
    ],
  };

  const liveChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { size: 12 },
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.97)',
        titleColor: '#10b981',
        bodyColor: '#e2e8f0',
        borderColor: '#10b981',
        borderWidth: 1,
        padding: 14,
        cornerRadius: 10,
        displayColors: false,
        callbacks: {
          title: (items) => '🕐 ' + items[0].label,
          label: (item) => {
            const w = item.raw;
            const kwh = w / 1000 * 5 / 3600;
            const cost_per_reading = kwh * 6;
            const costStr = cost_per_reading < 0.01
              ? '< ₹0.01'
              : '₹' + cost_per_reading.toFixed(3);
            return [
              '⚡ Power: ' + formatWatts(w),
              '📊 ' + formatKwh(kwh) + ' this reading',
              '💰 ' + costStr + ' this reading',
            ];
          },
          afterLabel: (item) => {
            const w = item.raw;
            if (w > 1500) return '⚠️ High consumption';
            if (w < 300)  return '✅ Low consumption';
            return '📊 Normal usage';
          },
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time',
          color: '#64748b',
          font: { size: 11 }
        },
        ticks: {
          color: '#64748b',
          maxRotation: 0,
          maxTicksLimit: 8,
          font: { size: 10 }
        },
        grid: { color: 'rgba(100,116,139,0.1)' }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Watts (W)',
          color: '#64748b',
          font: { size: 11 }
        },
        min: 0,
        // Dynamic ceiling: round the data peak up to the nearest 500W, then add
        // 500W of headroom so the line is never clipped.
        max: (() => {
          const peak = chartPoints.watts.length
            ? Math.max(...chartPoints.watts)
            : 0;
          const ceiling = Math.ceil((peak + 500) / 500) * 500;
          return Math.max(ceiling, 3000); // never go below 3000W on the axis
        })(),
        ticks: {
          color: '#64748b',
          callback: (v) => v + 'W',
          // Keep ~6 ticks regardless of scale
          maxTicksLimit: 7,
          font: { size: 10 }
        },
        grid: { color: 'rgba(100,116,139,0.1)' }
      }
    }
  }

  const renderIcon = (iconStr) => {
    const cls = 'w-8 h-8 mb-3';
    switch (iconStr) {
      case 'ac':   return <Snowflake className={cls} />;
      case 'heat': return <Flame     className={cls} />;
      case 'pc':   return <Monitor   className={cls} />;
      case 'micro':return <ChefHat   className={cls} />;
      default:     return <Zap       className={cls} />;
    }
  };

  // ── JSX ───────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8 font-sans w-full max-w-7xl mx-auto
                    transition-colors duration-500">

      {/* WebSocket status banner */}
      {wsStatus !== 'connected' && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-yellow-500
                        text-white px-4 py-2 rounded-full shadow-lg z-50
                        animate-pulse text-sm font-semibold flex items-center gap-2">
          <WifiOff className="w-4 h-4" />
          {wsStatus === 'connecting'   ? 'Connecting...'        :
           wsStatus === 'reconnecting' ? 'Reconnecting in 3s...' :
                                        'Connection error'}
        </div>
      )}

      {/* Welcome */}
      <div className="mb-4">
        <p className="text-xl">
          Welcome back,{' '}
          <span className="font-bold text-cyan-500">
            {user?.display_name || user?.email}
          </span>!
        </p>
      </div>

      {/* ── Budget Warning Banner ── */}
      {isOverBudget ? (
        <div className="flex items-center gap-3 p-4 mb-4
                        bg-red-100 dark:bg-red-900/30
                        border border-red-300 dark:border-red-800
                        rounded-xl text-red-700 dark:text-red-400 animate-pulse">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <p className="font-bold">
            ⚠️ OVER BUDGET! You are {formatBill(Math.abs(remaining))} over
            your {formatBudget(budget)} limit.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 mb-4
                        bg-emerald-100 dark:bg-emerald-900/30
                        border border-emerald-300 dark:border-emerald-800
                        rounded-xl text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <p className="font-bold">
            ✅ Budget Safe — {formatBill(remaining)} remaining this month.
          </p>
        </div>
      )}

      {/* ── Units Progress Bar ── */}
      <div className="bg-white dark:bg-slate-800/60 
                      border border-slate-200 
                      dark:border-slate-700/60 
                      p-5 rounded-2xl shadow-sm mb-6">

        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-yellow-500"/>
            </div>
            <span className="font-semibold text-sm">Monthly Units Progress</span>
          </div>
          <span className="text-sm font-bold">
            {formatKwh(monthlyKwhEstimate)} / {formatKwh(unitLimit)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
            style={{ width: Math.min(unitsPercent, 100) + '%' }}
          />
        </div>

        {/* Bottom info row */}
        <div className="flex items-center justify-between">
          {/* Slab badge */}
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg
            ${slabResult.currentRate === 0
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
              : unitsPercent >= 80
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500'
            }`}>
            {slabResult.currentRate === 0 
              ? '✅ Free Tier' 
              : unitsPercent >= 80 
              ? '🔴 High Usage' 
              : '⚠️ Paid Tier'}
            {' '}— Slab {slabResult.currentSlab}
            {slabResult.currentRate > 0 ? ` (₹${slabResult.currentRate}/unit)` : ''}
          </span>

          {/* Percentage and state */}
          <div className="text-right">
            <span className={`text-sm font-bold
              ${unitsPercent >= 100 ? 'text-red-500' : unitsPercent >= 80 ? 'text-yellow-500' : 'text-emerald-500'}`}>
              {formatPercent(unitsPercent)}
            </span>
            <p className="text-xs text-slate-400 mt-0.5">{userState}</p>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        {/* Card 1 - Today's Usage */}
        <div className="bg-white dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-500"/>
            </div>
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"/>
          </div>
          <p className="text-2xl font-bold text-emerald-500">
            {formatKwh(todayKwh)}
          </p>
          <p className="text-xs font-medium text-slate-500 mt-2">Today's Real Usage</p>
        </div>

        {/* Card 2 - Current Power */}
        <div className="bg-white dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-cyan-500"/>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full
              ${effectiveWatts > 1500 
                ? 'bg-red-100 text-red-500' 
                : 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600'}`}>
              {effectiveWatts > 1500 ? 'HIGH' : 'NORMAL'}
            </span>
          </div>
          <p className="text-2xl font-bold">
            {formatWatts(effectiveWatts)}
          </p>
          <p className="text-xs font-medium text-slate-500 mt-2">Current Power Draw</p>
          {totalExtraWatts > 0 && (
            <>
              <p className="text-xs text-cyan-500 mt-1">
                +{totalExtraWatts}W appliances
              </p>
              <p className="text-xs text-rose-500 mt-0.5">
                + {formatBill(extraMonthlyCostINR)}/mo
              </p>
            </>
          )}
        </div>

        {/* Card 3 - Units Consumed */}
        <div className="bg-white dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-5 border border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-blue-500"/>
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-500">
            {formatKwh(totalKwh)}
          </p>
          <p className="text-xs font-medium text-slate-500 mt-2">Total Units Consumed</p>
        </div>

        {/* Card 4 - Projected Bill */}
        <div className={`backdrop-blur-sm rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all
          ${isOverBudget 
            ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800/60' 
            : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60'
          }`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center
              ${isOverBudget ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
              <IndianRupee className={`w-5 h-5 ${isOverBudget ? 'text-red-500' : 'text-emerald-500'}`}/>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full
              ${isOverBudget 
                ? 'bg-red-100 text-red-600' 
                : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'}`}>
              {isOverBudget ? 'OVER' : 'SAFE'}
            </span>
          </div>
          <p className={`text-2xl font-bold ${isOverBudget ? 'text-red-500' : 'text-emerald-500'}`}>
            {formatBill(projectedBillINR)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            projected / {formatBudget(budget)} limit
          </p>
          <p className="text-xs font-medium text-slate-500 mt-2">
            {userState} • {slab.range}
          </p>
        </div>
      </div>

      {/* ── Live Chart ── */}
      <div className="bg-white dark:bg-slate-800/50 border
                      border-slate-200 dark:border-slate-700
                      p-6 rounded-2xl shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center
                        justify-between mb-5 gap-3">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-500" />
              Live Power Consumption
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Real-time updates every 5 seconds
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-emerald-500/10 border border-emerald-500/30
                            rounded-lg px-3 py-1.5">
              <span className="text-emerald-400 font-bold text-sm">
                {effectiveWatts.toFixed(0)}W
              </span>
              <span className="text-slate-400 text-xs ml-1">now</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full
                ${wsStatus === 'connected'
                  ? 'bg-green-400 animate-pulse'
                  : 'bg-red-400'}`} />
              <span className="text-xs text-slate-400">
                {wsStatus === 'connected' ? 'Live' : 'Offline'}
              </span>
            </div>
            {lastUpdateTime && (
              <span className="text-xs text-slate-500">
                Last: {lastUpdateTime}
              </span>
            )}
          </div>
        </div>

        {chartPoints.labels.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center gap-4" style={{ height: '380px' }}>
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin"/>
              <Zap className="w-6 h-6 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/>
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-300">
                Connecting to live feed...
              </p>
              <p className="text-sm text-slate-500 mt-1">
                First reading arrives in ~5 seconds
              </p>
            </div>
            <div className="flex gap-1 mt-2">
              {[0,1,2,3,4].map(i => (
                <div key={i}
                  className="w-2 bg-emerald-500/30 rounded-full animate-pulse"
                  style={{
                    height: Math.random() * 40 + 20 + 'px',
                    animationDelay: i * 0.15 + 's'
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full" style={{ height: '380px' }}>
            <Line
              key="live-chart"
              data={liveChartData}
              options={liveChartOptions}
            />
          </div>
        )}
      </div>

      {/* ── Bottom Grid: Simulator + History ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

        {/* Appliance Simulator */}
        <div className="bg-white dark:bg-slate-800/50 border
                        border-slate-200 dark:border-slate-700
                        p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 tracking-wider">
                VIRTUAL APPLIANCE SIMULATOR
              </h3>
              <p className="text-xs text-cyan-600 dark:text-cyan-400 font-bold mt-1">
                {totalExtraWatts > 0 ? '+' : ''}{formatWatts(totalExtraWatts)} Active Load
              </p>
            </div>
            <Link
              to="/appliances"
              className="text-sm bg-slate-100 dark:bg-slate-700
                         hover:bg-slate-200 dark:hover:bg-slate-600
                         px-3 py-1.5 rounded-lg transition"
            >
              Manage →
            </Link>
          </div>

          {appliances.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                No appliances added yet.
              </p>
              <Link to="/appliances" className="text-cyan-500 text-xs hover:underline">
                Go to Appliances →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {appliances.map(app => {
                const isActive = app.is_active;
                const monthCostINR =
                  (app.watts / 1000) * 6 * 30 * INR_RATE_PER_KWH;
                return (
                  <button
                    key={app.id}
                    onClick={() => toggleAppliance(app.id)}
                    className={`w-full flex flex-col items-center justify-center
                               p-4 rounded-xl border-2 transition-all duration-300
                               ${isActive
                                 ? 'bg-cyan-50 dark:bg-cyan-900/30 border-cyan-400 text-cyan-600 dark:text-cyan-400 shadow-md shadow-cyan-500/20 scale-[1.03]'
                                 : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300'
                               }`}
                  >
                    {renderIcon(app.icon)}
                    <span className="font-bold text-sm mb-1">{app.name}</span>
                    <span className="text-xs opacity-70">+{app.watts}W</span>
                    <span className="text-[10px] opacity-50 mt-1">
                      {formatBill(monthCostINR)}/mo extra
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Usage History */}
        <div className="bg-white dark:bg-slate-800/50 border
                        border-slate-200 dark:border-slate-700
                        p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          {dailyData?.has_data ? (
            <div className="grid grid-rows-2 gap-6 flex-1">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-slate-500 tracking-wider">
                    DAILY USAGE
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      Polled: {lastPolled}
                    </span>
                    <span className="text-xs font-semibold text-green-500
                                     bg-green-100 dark:bg-green-900/30
                                     px-2 py-1 rounded-md animate-pulse">
                      Live Recording
                    </span>
                  </div>
                </div>
                <div className="h-40">
                  <Bar
                    key={JSON.stringify(dailyData.data)}
                    data={{
                      labels: dailyData.labels,
                      datasets: [{
                        label: 'Daily kWh',
                        data: dailyData.data,
                        backgroundColor: dailyData.data?.map(v =>
                          v > 0
                            ? 'rgba(16, 185, 129, 0.8)'
                            : 'rgba(100, 116, 139, 0.3)'
                        ),
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 2,
                        borderRadius: 6,
                        minBarLength: 4,
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      animation: { duration: 500 },
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: (ctx) =>
                              ctx.raw === 0
                                ? 'No usage recorded'
                                : `${ctx.raw.toFixed(4)} kWh`,
                          },
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: { callback: (val) => `${val.toFixed(3)} kWh` },
                        },
                        x: { grid: { display: false } },
                      },
                    }}
                  />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-500
                               tracking-wider mb-4">
                  WEEKLY TRENDS
                </h3>
                <div className="h-40">
                  <Bar
                    key={JSON.stringify(weeklyData.data)}
                    data={{
                      labels: weeklyData.labels,
                      datasets: [{
                        label: 'Weekly kWh',
                        data: weeklyData.data,
                        backgroundColor: weeklyData.data?.map(v =>
                          v > 0
                            ? 'rgba(59, 130, 246, 0.8)'
                            : 'rgba(100, 116, 139, 0.3)'
                        ),
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 2,
                        borderRadius: 6,
                        minBarLength: 4,
                      }],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      animation: { duration: 500 },
                      plugins: { legend: { display: false } },
                      scales: {
                        y: { display: false },
                        x: { grid: { display: false } },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center
                            h-48 gap-3 border-2 border-dashed
                            border-slate-200 dark:border-slate-700
                            rounded-xl p-6">
              <span className="text-4xl">📊</span>
              <p className="text-slate-700 dark:text-slate-300 font-medium text-center">
                No usage history yet.
              </p>
              <p className="text-slate-500 text-sm text-center">
                Your real usage will appear here as data accumulates.
              </p>
              <p className="text-green-500 text-xs flex items-center gap-2 mt-2 font-semibold">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Recording started — check back in 30 seconds
              </p>
            </div>
          )}
        </div>
      </div>


    </div>
  );
}
