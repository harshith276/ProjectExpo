import React, { useState, useEffect } from 'react';
import {
  Save, User, Wallet, Moon, Sun,
  ArrowLeft, Loader2, Zap, MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api';
import { formatBudget, formatKwh } from '../utils/format';

// Indian state electricity slabs (₹ per unit/kWh)
const STATE_SLABS = {
  "Tamil Nadu": [
    [100, 0.00],
    [200, 1.50],
    [500, 3.00],
    [Infinity, 5.00]
  ],
  "Karnataka": [
      [100, 4.75],
      [200, 7.00],
      [Infinity, 8.00]
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

// Helper to get slab rows for display
function getSlabRows(state) {
  const slabs = STATE_SLABS[state]
  if (!slabs) return []
  const rows = []
  let prev = 0
  slabs.forEach(([limit, rate]) => {
    const label = limit === Infinity
      ? prev + '+ units'
      : prev + '–' + limit + ' units'
    rows.push({ label, rate, isFree: rate === 0 })
    prev = limit === Infinity ? prev : limit
  })
  return rows
}

export default function Settings() {
  const { user, setUser } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  // Profile fields - initialize empty, will sync from user in useEffect
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail]             = useState('');

  // Budget — always in INR ₹
  const [budget, setBudget] = useState(2000);

  // Indian state for slab billing
  const [state, setState] = useState('Tamil Nadu');

  // Monthly unit limit (kWh)
  const [unitLimit, setUnitLimit] = useState(200);

  const [isLoading, setIsLoading]   = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [budgetMsg, setBudgetMsg]   = useState('');

  // Sync when user loads - safe to call setState here as this is data synchronization
  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayName(user.display_name || '');
      setEmail(user.email || '');
      setBudget(user.budget || 2000);
      setState(user.state || 'Tamil Nadu');
      setUnitLimit(user.monthly_unit_limit || 200);
    }
  }, [user]);

  // ── Save profile ──────────────────────────────────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setProfileMsg('');
    try {
      const res = await api.put('/api/user/profile', {
        display_name: displayName,
        email,
      });
      setUser(res.data);
      setProfileMsg('✅ Profile updated successfully!');
    } catch {
      setProfileMsg('❌ Failed to update profile.');
    }
    setIsLoading(false);
  };

  // ── Save budget + state + unit limit ─────────────────────
  const handleSaveFinancials = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setBudgetMsg('');
    try {
      await api.put('/api/user/settings', {
        budget: parseFloat(budget),        // always INR
        state,
        monthly_unit_limit: parseFloat(unitLimit),
      });
      setBudgetMsg('✅ Settings saved successfully!');
    } catch {
      setBudgetMsg('❌ Failed to save settings.');
    }
    setIsLoading(false);
  };

  const slabRows = getSlabRows(state);

  return (
    <div className="min-h-screen p-6 bg-slate-50 dark:bg-[#0b0f19]
                    text-slate-900 dark:text-white transition-colors duration-500">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center mb-8 gap-4">
          <Link
            to="/"
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800
                       rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            Settings & Profile
          </h1>
        </div>

        <div className="space-y-6">

          {/* ── SECTION 1: User Profile ───────────────────── */}
          <section className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl
                              border border-slate-200 dark:border-slate-700
                              shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4
                            text-cyan-600 dark:text-cyan-400">
              <User className="w-5 h-5" />
              <h2 className="text-xl font-semibold">User Profile</h2>
            </div>

            {profileMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-xl text-sm font-medium
                           bg-emerald-100 dark:bg-emerald-900/30
                           text-emerald-800 dark:text-emerald-400
                           border border-emerald-200 dark:border-emerald-800"
              >
                {profileMsg}
              </motion.div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-900
                             border border-slate-300 dark:border-slate-700
                             rounded-xl focus:ring-2 focus:ring-cyan-500
                             outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-900
                             border border-slate-300 dark:border-slate-700
                             rounded-xl focus:ring-2 focus:ring-cyan-500
                             outline-none transition"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2
                           bg-cyan-600 hover:bg-cyan-500 text-white
                           rounded-lg transition-colors font-medium text-sm"
              >
                {isLoading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Save className="w-4 h-4" />}
                Save Profile
              </button>
            </form>
          </section>

          {/* ── SECTION 2: Budget & Slab Settings ────────── */}
          <section className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl
                              border border-slate-200 dark:border-slate-700
                              shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4
                            text-emerald-600 dark:text-emerald-400">
              <Wallet className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Budget & Billing</h2>
            </div>

            {budgetMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-xl text-sm font-medium
                           bg-emerald-100 dark:bg-emerald-900/30
                           text-emerald-800 dark:text-emerald-400
                           border border-emerald-200 dark:border-emerald-800"
              >
                {budgetMsg}
              </motion.div>
            )}

            <form onSubmit={handleSaveFinancials} className="space-y-5 max-w-md">

              {/* Monthly Bill Budget in INR */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Monthly Bill Budget — <span className="text-emerald-500 font-bold">{formatBudget(budget)}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2
                                   text-emerald-500 font-bold text-lg">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="100"
                    max="50000"
                    step="100"
                    value={budget}
                    onChange={e => setBudget(e.target.value)}
                    onWheel={(e) => e.target.blur()}
                    required
                    className="w-full pl-8 pr-4 py-2 bg-slate-100 dark:bg-slate-900
                               border border-slate-300 dark:border-slate-700
                               rounded-xl focus:ring-2 focus:ring-emerald-500
                               outline-none transition"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  💡 Average Indian household bill: ₹500 – ₹3,000/month.
                  We alert you before you exceed this.
                </p>
              </div>

              {/* Monthly Unit Limit */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Monthly Unit Limit — <span className="text-yellow-500 font-bold">{formatKwh(unitLimit)}</span>
                </label>
                <div className="relative">
                  <Zap className="absolute left-3 top-1/2 -translate-y-1/2
                                   w-4 h-4 text-yellow-500" />
                  <input
                    type="number"
                    min="50"
                    max="2000"
                    step="10"
                    value={unitLimit}
                    onChange={e => setUnitLimit(e.target.value)}
                    onWheel={(e) => e.target.blur()}
                    required
                    className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-900
                               border border-slate-300 dark:border-slate-700
                               rounded-xl focus:ring-2 focus:ring-yellow-500
                               outline-none transition"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  💡 Average Indian household uses 100–300 units/month
                </p>
              </div>

              {/* State Selector */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Your State (for EB slab rates)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2
                                     w-4 h-4 text-red-400" />
                  <select
                    value={state}
                    onChange={e => setState(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-900
                               border border-slate-300 dark:border-slate-700
                               rounded-xl focus:ring-2 focus:ring-red-400
                               outline-none transition appearance-none"
                  >
                    {Object.keys(STATE_SLABS).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Slab Rate Table for selected state */}
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4
                              border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-500 uppercase
                              tracking-wider mb-3">
                  {state} — EB Slab Rates
                </p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-400 border-b
                                   border-slate-200 dark:border-slate-700">
                      <th className="text-left pb-2">Units</th>
                      <th className="text-right pb-2">Rate (₹/unit)</th>
                      <th className="text-right pb-2">Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slabRows.map((row, i) => (
                      <tr
                        key={i}
                        className="border-b border-slate-100 dark:border-slate-800
                                   last:border-0"
                      >
                        <td className="py-1.5 text-slate-600 dark:text-slate-300">
                          {row.label}
                        </td>
                        <td className="py-1.5 text-right font-semibold
                                       text-emerald-600 dark:text-emerald-400">
                          {row.rate === 0
                            ? '₹0.00 (FREE)'
                            : `₹${row.rate.toFixed(2)}/unit`}
                        </td>
                        <td className="py-1.5 text-right text-xs text-slate-400">
                          Slab {i + 1}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2
                           bg-emerald-600 hover:bg-emerald-500 text-white
                           rounded-lg transition-colors font-medium text-sm"
              >
                {isLoading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Save className="w-4 h-4" />}
                Save Financials
              </button>
              <p className="text-xs text-slate-400 italic mt-3 text-left">💡 Note: Estimated bills are based on standard state tariffs and may not include local fixed charges, taxes, or specific government subsidies (e.g., Gruha Jyothi).</p>
            </form>
          </section>

          {/* ── SECTION 3: Appearance ────────────────────── */}
          <section className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl
                              border border-slate-200 dark:border-slate-700
                              shadow-sm backdrop-blur-sm
                              flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-1
                              text-indigo-600 dark:text-indigo-400">
                {isDarkMode
                  ? <Moon className="w-5 h-5" />
                  : <Sun className="w-5 h-5" />}
                <h2 className="text-xl font-semibold">Dark Mode</h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Toggle application appearance.
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-8 w-14 items-center
                         rounded-full transition-colors
                         ${isDarkMode ? 'bg-cyan-500' : 'bg-slate-300'}`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full
                           bg-white transition-transform
                           ${isDarkMode ? 'translate-x-7' : 'translate-x-1'}`}
              />
            </button>
          </section>

        </div>
      </div>
    </div>
  );
}
