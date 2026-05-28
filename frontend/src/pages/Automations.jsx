import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Plus, Trash2, Zap, ZapOff, Loader2, ArrowRight } from 'lucide-react';
import api from '../api';

// ─── Animated Toggle Switch ────────────────────────────────────────────────
function ToggleSwitch({ isActive, onToggle, loading }) {
  return (
    <button
      onClick={onToggle}
      disabled={loading}
      aria-label={isActive ? 'Turn OFF Rule' : 'Turn ON Rule'}
      className={`relative inline-flex h-7 w-13 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
        isActive
          ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30'
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

// ─── Automation Card ───────────────────────────────────────────────────────
function AutomationCard({ automation, appliance, onToggle, onDelete, toggling, deleting }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -8 }}
      transition={{ duration: 0.25 }}
      className={`relative group rounded-2xl border p-5 flex flex-col gap-4 transition-all duration-300 ${
        automation.is_active
          ? 'bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border-violet-500/40 dark:border-violet-500/30 shadow-lg shadow-violet-500/10'
          : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
      }`}
    >
      {/* Active glow dot */}
      {automation.is_active && (
        <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-fuchsia-400 shadow-md shadow-fuchsia-400/60 animate-pulse" />
      )}

      {/* Icon + Name */}
      <div className="flex items-center gap-3">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
            automation.is_active
              ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-md shadow-violet-500/30'
              : 'bg-slate-100 dark:bg-slate-700'
          }`}
        >
          <Settings className={`w-5 h-5 ${automation.is_active ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 dark:text-white truncate text-[15px]">
            {automation.name}
          </p>
        </div>
      </div>

      {/* Logic Display */}
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 flex flex-col gap-2 border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="font-medium text-amber-500 dark:text-amber-400">IF Total Power &gt; {automation.threshold_watts}W</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <span>Turn OFF </span>
          <span className="font-semibold text-slate-900 dark:text-white">{appliance ? appliance.name : 'Unknown Device'}</span>
        </div>
      </div>

      {/* Footer: toggle + delete */}
      <div className="flex items-center justify-between mt-auto pt-2">
        <div className="flex items-center gap-2.5">
          <ToggleSwitch
            isActive={automation.is_active}
            onToggle={() => onToggle(automation.id)}
            loading={toggling}
          />
          <span
            className={`text-xs font-semibold tracking-wide uppercase ${
              automation.is_active
                ? 'text-fuchsia-500 dark:text-fuchsia-400'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {automation.is_active ? 'ACTIVE' : 'DISABLED'}
          </span>
        </div>

        <button
          onClick={() => onDelete(automation.id)}
          disabled={deleting}
          aria-label={`Delete ${automation.name}`}
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
export default function Automations() {
  const [automations, setAutomations] = useState([]);
  const [appliances, setAppliances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [threshold, setThreshold] = useState('');
  const [targetApplianceId, setTargetApplianceId] = useState('');
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState('');

  // Per-card loading states
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // ── Fetch on mount ────────────────────────────────────────────────
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [autoRes, appRes] = await Promise.all([
        api.get('/api/automations/'),
        api.get('/api/appliances/')
      ]);
      setAutomations(autoRes.data);
      setAppliances(appRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Could not load automations. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Add automation ─────────────────────────────────────────────────
  async function handleAdd(e) {
    e.preventDefault();
    setFormError('');

    const trimmedName = name.trim();
    const parsedThreshold = parseInt(threshold, 10);
    const parsedTargetId = parseInt(targetApplianceId, 10);

    if (!trimmedName) return setFormError('Rule name is required.');
    if (!threshold || isNaN(parsedThreshold) || parsedThreshold <= 0)
      return setFormError('Enter a valid power threshold (W).');
    if (!parsedTargetId) return setFormError('Please select a target appliance.');

    setAdding(true);
    try {
      const res = await api.post('/api/automations/', {
        name: trimmedName,
        threshold_watts: parsedThreshold,
        target_appliance_id: parsedTargetId,
        is_active: true,
      });
      setAutomations((prev) => [res.data, ...prev]);
      setName('');
      setThreshold('');
      setTargetApplianceId('');
    } catch (err) {
      console.error('Failed to add automation:', err);
      setFormError('Failed to save automation. Please try again.');
    } finally {
      setAdding(false);
    }
  }

  // ── Toggle automation ──────────────────────────────────────────────
  async function handleToggle(id) {
    setTogglingId(id);
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_active: !a.is_active } : a))
    );
    try {
      const res = await api.put(`/api/automations/${id}/toggle`);
      setAutomations((prev) =>
        prev.map((a) => (a.id === id ? res.data : a))
      );
    } catch (err) {
      console.error('Toggle failed:', err);
      setAutomations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_active: !a.is_active } : a))
      );
    } finally {
      setTogglingId(null);
    }
  }

  // ── Delete automation ──────────────────────────────────────────────
  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await api.delete(`/api/automations/${id}`);
      setAutomations((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  }

  const activeCount = automations.filter((a) => a.is_active).length;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-white transition-colors duration-500">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* ── Page Header ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Automations</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              Create smart rules to automatically manage your energy consumption.
            </p>
          </div>

          {/* Live stats pill */}
          {automations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl px-4 py-2.5 text-sm shadow-sm shrink-0"
            >
              <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse" />
              <span className="font-semibold text-slate-900 dark:text-white">
                {activeCount} active rules
              </span>
            </motion.div>
          )}
        </div>

        {/* ── Add Automation Form ───────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-700/60 p-5 sm:p-6 shadow-sm">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-md shadow-violet-500/25">
              <Plus className="w-4 h-4 text-white" />
            </div>
            Create New Rule
          </h2>

          <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setFormError(''); }}
              placeholder="Rule Name (e.g. Overload Protection)"
              className="w-full md:flex-1 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder-slate-400 dark:placeholder-slate-500"
              disabled={adding}
              autoComplete="off"
            />
            
            <div className="w-full md:w-auto flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500 transition-all">
              <span className="text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">If Power &gt;</span>
              <input
                type="number"
                value={threshold}
                onChange={(e) => { setThreshold(e.target.value); setFormError(''); }}
                placeholder="Watts"
                min="1"
                className="w-20 bg-transparent text-[15px] focus:outline-none text-slate-900 dark:text-white"
                disabled={adding}
              />
            </div>

            <div className="w-full md:w-auto flex items-center gap-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500 transition-all">
               <span className="text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap pl-1">Turn OFF</span>
               <select
                 value={targetApplianceId}
                 onChange={(e) => { setTargetApplianceId(e.target.value); setFormError(''); }}
                 className="w-full md:w-40 bg-transparent text-[15px] focus:outline-none text-slate-900 dark:text-white disabled:opacity-60 py-1"
                 disabled={adding || appliances.length === 0}
               >
                 <option value="" disabled className="text-slate-400 dark:bg-slate-800">Select Appliance</option>
                 {appliances.map(app => (
                   <option key={app.id} value={app.id} className="dark:bg-slate-800 dark:text-white">{app.name}</option>
                 ))}
               </select>
            </div>

            <button
              type="submit"
              disabled={adding}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white font-semibold rounded-xl px-6 py-3 transition-all duration-200 shadow-md shadow-violet-500/25 disabled:opacity-60 disabled:cursor-not-allowed shrink-0 text-[15px]"
            >
              {adding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {adding ? 'Saving…' : 'Save Rule'}
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

        {/* ── Automations Grid ──────────────────────────────────────── */}
        {loading ? (
          /* Skeleton loader */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 p-5 space-y-4 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-200 dark:bg-slate-700" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 rounded-lg bg-slate-200 dark:bg-slate-700 w-3/4" />
                  </div>
                </div>
                <div className="h-16 rounded-xl bg-slate-200 dark:bg-slate-700 w-full" />
                <div className="h-7 rounded-full bg-slate-200 dark:bg-slate-700 w-13 mt-2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 text-red-500 dark:text-red-400 text-sm">
            {error}{' '}
            <button
              onClick={fetchData}
              className="underline hover:no-underline ml-1"
            >
              Retry
            </button>
          </div>
        ) : automations.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/15 to-fuchsia-600/15 border border-violet-500/20 flex items-center justify-center mb-6">
              <Settings className="w-10 h-10 text-violet-500/60" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
              No automations set
            </h3>
            <p className="text-slate-500 dark:text-slate-500 text-sm max-w-xs">
              Create rules to automatically turn off appliances when power consumption gets too high.
            </p>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {automations.map((automation) => (
                <AutomationCard
                  key={automation.id}
                  automation={automation}
                  appliance={appliances.find(a => a.id === automation.target_appliance_id)}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  toggling={togglingId === automation.id}
                  deleting={deletingId === automation.id}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
