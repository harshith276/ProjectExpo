import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Plus, Trash2, Plug, ZapOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

// ─── Animated Toggle Switch ────────────────────────────────────────────────
function ToggleSwitch({ isActive, onToggle, loading }) {
  return (
    <button
      id={`toggle-switch-${Math.random()}`}
      onClick={onToggle}
      disabled={loading}
      aria-label={isActive ? 'Turn OFF' : 'Turn ON'}
      className={`relative inline-flex h-7 w-13 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
        isActive
          ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 shadow-lg shadow-cyan-500/30'
          : 'bg-slate-300 dark:bg-slate-600'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 700, damping: 35 }}
        className={`inline-block h-5 w-5 rounded-full bg-white shadow-md ${
          isActive ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// ─── Appliance Card ────────────────────────────────────────────────────────
function ApplianceCard({ appliance, onToggle, onDelete, toggling, deleting }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -8 }}
      transition={{ duration: 0.25 }}
      className={`relative group rounded-2xl border p-5 flex flex-col gap-4 transition-all duration-300 ${
        appliance.is_active
          ? 'bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 border-cyan-500/40 dark:border-cyan-500/30 shadow-lg shadow-cyan-500/10'
          : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
      }`}
    >
      {/* Active glow dot */}
      {appliance.is_active && (
        <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/60 animate-pulse" />
      )}

      {/* Icon + Name */}
      <div className="flex items-center gap-3">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
            appliance.is_active
              ? 'bg-gradient-to-br from-cyan-500 to-emerald-500 shadow-md shadow-cyan-500/30'
              : 'bg-slate-100 dark:bg-slate-700'
          }`}
        >
          {appliance.is_active ? (
            <Plug className="w-5 h-5 text-white" />
          ) : (
            <ZapOff className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 dark:text-white truncate text-[15px]">
            {appliance.name}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            {appliance.watts} W
          </p>
        </div>
      </div>

      {/* Footer: toggle + delete */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ToggleSwitch
            isActive={appliance.is_active}
            onToggle={() => onToggle(appliance.id)}
            loading={toggling}
          />
          <span
            className={`text-xs font-semibold tracking-wide uppercase ${
              appliance.is_active
                ? 'text-emerald-500 dark:text-emerald-400'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {appliance.is_active ? 'ON' : 'OFF'}
          </span>
        </div>

        <button
          id={`delete-appliance-${appliance.id}`}
          onClick={() => onDelete(appliance.id)}
          disabled={deleting}
          aria-label={`Delete ${appliance.name}`}
          className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function Appliances() {
  const [appliances, setAppliances] = useState([]);
  const prevAppliancesRef = useRef([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    prevAppliancesRef.current = appliances;
  }, [appliances]);

  // Form state
  const [name, setName] = useState('');
  const [watts, setWatts] = useState('');
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState('');

  // Per-card loading states (keyed by appliance id)
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // ── Fetch on mount and poll ──────────────────────────────────────
  useEffect(() => {
    fetchAppliances(true);
    const interval = setInterval(() => {
      fetchAppliances(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchAppliances(isInitial = true) {
    if (isInitial) setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/appliances/');
      const prevApps = prevAppliancesRef.current;
      
      if (!isInitial && prevApps.length > 0) {
        prevApps.forEach(oldApp => {
          const newApp = res.data.find(a => a.id === oldApp.id);
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
      
      setAppliances(res.data);
    } catch (err) {
      console.error('Failed to load appliances:', err);
      if (isInitial) setError('Could not load appliances. Please try again.');
    } finally {
      if (isInitial) setLoading(false);
    }
  }

  // ── Add appliance ─────────────────────────────────────────────────
  async function handleAdd(e) {
    e.preventDefault();
    setFormError('');

    const trimmedName = name.trim();
    const parsedWatts = parseInt(watts, 10);

    if (!trimmedName) return setFormError('Appliance name is required.');
    if (!watts || isNaN(parsedWatts) || parsedWatts <= 0)
      return setFormError('Enter a valid wattage (positive integer).');

    setAdding(true);
    try {
      const res = await api.post('/api/appliances/', {
        name: trimmedName,
        watts: parsedWatts,
        is_active: false,
      });
      setAppliances((prev) => [res.data, ...prev]);
      setName('');
      setWatts('');
    } catch (err) {
      console.error('Failed to add appliance:', err);
      setFormError('Failed to add appliance. Please try again.');
    } finally {
      setAdding(false);
    }
  }

  // ── Toggle appliance ──────────────────────────────────────────────
  async function handleToggle(id) {
    setTogglingId(id);
    // Optimistic update
    setAppliances((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_active: !a.is_active } : a))
    );
    try {
      const res = await api.put(`/api/appliances/${id}/toggle`);
      // Sync with server truth
      setAppliances((prev) =>
        prev.map((a) => (a.id === id ? res.data : a))
      );
    } catch (err) {
      console.error('Toggle failed:', err);
      // Revert on error
      setAppliances((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_active: !a.is_active } : a))
      );
    } finally {
      setTogglingId(null);
    }
  }

  // ── Delete appliance ──────────────────────────────────────────────
  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await api.delete(`/api/appliances/${id}`);
      setAppliances((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  }

  // ── Derived stats ─────────────────────────────────────────────────
  const activeCount = appliances.filter((a) => a.is_active).length;
  const activeWatts = appliances
    .filter((a) => a.is_active)
    .reduce((sum, a) => sum + a.watts, 0);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-white transition-colors duration-500">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── Page Header ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Appliances</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              Manage your smart home devices and track their power draw.
            </p>
          </div>

          {/* Live stats pill */}
          {appliances.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl px-4 py-2.5 text-sm shadow-sm shrink-0"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-slate-900 dark:text-white">
                {activeCount} active
              </span>
              <span className="text-slate-400">·</span>
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-slate-900 dark:text-white">
                {activeWatts} W
              </span>
            </motion.div>
          )}
        </div>

        {/* ── Add Appliance Form ───────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-700/60 p-5 sm:p-6 shadow-sm">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/25">
              <Plus className="w-4 h-4 text-white" />
            </div>
            Add New Appliance
          </h2>

          <form
            id="add-appliance-form"
            onSubmit={handleAdd}
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              id="appliance-name-input"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setFormError(''); }}
              placeholder="Appliance Name (e.g. Air Conditioner)"
              className="flex-1 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder-slate-400 dark:placeholder-slate-500"
              disabled={adding}
              autoComplete="off"
            />
            <input
              id="appliance-watts-input"
              type="number"
              value={watts}
              onChange={(e) => { setWatts(e.target.value); setFormError(''); }}
              placeholder="Power Draw (W)"
              min="1"
              className="w-full sm:w-44 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder-slate-400 dark:placeholder-slate-500"
              disabled={adding}
            />
            <button
              id="add-appliance-submit"
              type="submit"
              disabled={adding}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl px-6 py-3 transition-all duration-200 shadow-md shadow-cyan-500/25 disabled:opacity-60 disabled:cursor-not-allowed shrink-0 text-[15px]"
            >
              {adding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {adding ? 'Adding…' : 'Add'}
            </button>
          </form>

          {/* Form error */}
          <AnimatePresence>
            {formError && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 text-sm text-red-500 dark:text-red-400"
              >
                {formError}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* ── Appliances Grid ──────────────────────────────────────── */}
        {loading ? (
          /* Skeleton loader */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 p-5 space-y-4 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-200 dark:bg-slate-700" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 rounded-lg bg-slate-200 dark:bg-slate-700 w-3/4" />
                    <div className="h-3 rounded-lg bg-slate-200 dark:bg-slate-700 w-1/3" />
                  </div>
                </div>
                <div className="h-7 rounded-full bg-slate-200 dark:bg-slate-700 w-13" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-500 dark:text-red-400 text-sm">
            {error}{' '}
            <button
              onClick={fetchAppliances}
              className="underline hover:no-underline ml-1"
            >
              Retry
            </button>
          </div>
        ) : appliances.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-500/15 to-blue-600/15 border border-cyan-500/20 flex items-center justify-center mb-6">
              <Plug className="w-10 h-10 text-cyan-500/60" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
              No appliances yet
            </h3>
            <p className="text-slate-500 dark:text-slate-500 text-sm max-w-xs">
              Add your first appliance using the form above to start tracking
              your home energy usage.
            </p>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {appliances.map((appliance) => (
                <ApplianceCard
                  key={appliance.id}
                  appliance={appliance}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  toggling={togglingId === appliance.id}
                  deleting={deletingId === appliance.id}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
