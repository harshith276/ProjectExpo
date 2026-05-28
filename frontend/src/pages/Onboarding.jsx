import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Zap, CheckCircle2 } from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Step 2 State
  const [houseSize, setHouseSize] = useState('');
  const [peopleCount, setPeopleCount] = useState('');
  const [location, setLocation] = useState('');

  // Step 3 State
  const [budget, setBudget] = useState(2000);

  // Step 4 State
  const applianceList = [
    { id: 'ac', name: 'Air Conditioner', watts: 1500, icon: '❄️' },
    { id: 'heater', name: 'Water Heater', watts: 2000, icon: '🔥' },
    { id: 'pc', name: 'Gaming PC', watts: 600, icon: '🖥️' },
    { id: 'tv', name: 'Television', watts: 150, icon: '📺' },
    { id: 'washer', name: 'Washing Machine', watts: 500, icon: '🫧' },
    { id: 'microwave', name: 'Microwave', watts: 1000, icon: '🍳' },
    { id: 'lights', name: 'LED Lights', watts: 50, icon: '💡' },
    { id: 'fan', name: 'Ceiling Fan', watts: 75, icon: '🌀' }
  ];
  const [selectedApps, setSelectedApps] = useState({});

  const nextStep = () => setStep((s) => Math.min(s + 1, 5));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const toggleApp = (id) => {
    setSelectedApps(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFinish = async () => {
    try {
      // 1. Save Profile
      await api.put('/api/user/profile', {
        house_size: houseSize,
        people_count: peopleCount,
        location: location,
        is_onboarded: true
      });

      // 2. Save Budget
      await api.put('/api/user/budget', { budget: parseFloat(budget) });

      // 3. Save Default Appliances
      const activeApps = applianceList.filter(a => selectedApps[a.id]).map(a => ({
        name: a.name,
        watts: a.watts
      }));
      
      if (activeApps.length > 0) {
        await api.post('/api/appliances/defaults', activeApps);
      }

      // Refresh Window to force Auth Context to recognize is_onboarded flag correctly and Navigate globally
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Onboarding saving failed", err);
      alert("Failed to save data. Please check your connection.");
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#06b6d4', '#10b981', '#ffffff']
    });
  };

  // Prevent accessing if already onboarded natively checked in Router? We can double check.

  return (
    <div className="bg-[#0b0f19] min-h-screen text-white flex flex-col">
      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-800">
        <motion.div 
          className="h-full bg-cyan-500"
          initial={{ width: '20%' }}
          animate={{ width: `${(step / 5) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-3xl mx-auto">
        <span className="text-slate-500 font-bold tracking-widest text-sm mb-8">STEP {step} OF 5</span>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <WizardSlide key="step1">
              <div className="text-center">
                <div className="w-24 h-24 bg-cyan-900/30 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
                  <Zap className="w-12 h-12 text-cyan-400 animate-pulse" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to VoltVision AI, {user?.display_name || user?.email?.split('@')[0]}! 🎉</h1>
                <p className="text-slate-400 text-lg max-w-lg mx-auto mb-10">Let's set up your energy profile in just 3 quick steps to give you perfectly accurate predictions.</p>
                <NavButton onClick={nextStep} label="Let's Go →" primary />
              </div>
            </WizardSlide>
          )}

          {step === 2 && (
            <WizardSlide key="step2">
              <div className="w-full">
                <h1 className="text-3xl font-bold mb-8 text-center">Tell us about your home</h1>
                
                <div className="space-y-8">
                  <div>
                    <label className="block text-slate-400 mb-3 text-sm font-semibold uppercase">House Size</label>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                      {['Studio', '1BHK', '2BHK', '3BHK', 'Villa'].map(size => (
                        <button key={size} onClick={() => setHouseSize(size)} className={`py-3 rounded-xl font-medium border transition-colors ${houseSize === size ? 'bg-cyan-600 border-cyan-500' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}>
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-3 text-sm font-semibold uppercase">Number of People</label>
                    <div className="flex flex-wrap gap-3">
                      {['1', '2', '3', '4', '5+'].map(num => (
                        <button key={num} onClick={() => setPeopleCount(num)} className={`w-14 h-14 rounded-full font-medium border flex items-center justify-center transition-colors ${peopleCount === num ? 'bg-emerald-600 border-emerald-500' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}>
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-2 text-sm font-semibold uppercase">City / Location</label>
                    <input 
                      type="text" 
                      value={location} 
                      onChange={e => setLocation(e.target.value)} 
                      placeholder="e.g. New York, London, Mumbai"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                </div>

                <StepperNav onBack={prevStep} onNext={nextStep} validate={houseSize && peopleCount && location} />
              </div>
            </WizardSlide>
          )}

          {step === 3 && (
            <WizardSlide key="step3">
              <div className="w-full">
                <h1 className="text-3xl font-bold mb-2 text-center">Set your monthly energy budget</h1>
                <p className="text-center text-slate-400 mb-10">This helps us warn you gracefully before you overspend.</p>

                <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-8 mb-8 text-center relative overflow-hidden">
                   <p className="text-slate-400 font-medium uppercase tracking-wider text-sm mb-4">Monthly Cap</p>
                   <div className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 mb-8">
                     ₹{budget}
                   </div>

                   <input 
                      type="range" 
                      min={500} 
                      max={10000} 
                      step={100}
                      value={budget} 
                      onChange={e => setBudget(e.target.value)}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                   />
                </div>

                <StepperNav onBack={prevStep} onNext={nextStep} validate={true} />
              </div>
            </WizardSlide>
          )}

          {step === 4 && (
            <WizardSlide key="step4">
              <div className="w-full">
                <h1 className="text-3xl font-bold mb-8 text-center">Which appliances do you own?</h1>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {applianceList.map(app => {
                    const isSelected = selectedApps[app.id];
                    return (
                      <button 
                         key={app.id} 
                         onClick={() => toggleApp(app.id)}
                         className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 ${isSelected ? 'bg-emerald-900/40 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}
                      >
                         {isSelected && <CheckCircle2 className="absolute top-3 right-3 w-5 h-5 text-emerald-400" />}
                         <span className="text-3xl mb-3">{app.icon}</span>
                         <span className="font-semibold text-sm mb-1">{app.name}</span>
                         <span className="text-xs text-slate-400">{app.watts}W</span>
                      </button>
                    )
                  })}
                </div>

                <StepperNav onBack={prevStep} onNext={nextStep} validate={true} />
              </div>
            </WizardSlide>
          )}

          {step === 5 && (
            <WizardSlide key="step5" onAnimationComplete={triggerConfetti}>
              <div className="w-full text-center">
                <div className="w-24 h-24 bg-emerald-900/40 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                </div>
                <h1 className="text-4xl font-bold mb-4">You're all set! ⚡</h1>
                <p className="text-slate-400 mb-8">Your smart home profile is completely configured.</p>

                <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl max-w-sm mx-auto mb-10 text-left">
                   <div className="flex justify-between border-b border-slate-700 pb-3 mb-3">
                      <span className="text-slate-400">Home</span>
                      <span className="font-semibold">{houseSize}, {peopleCount} people</span>
                   </div>
                   <div className="flex justify-between border-b border-slate-700 pb-3 mb-3">
                      <span className="text-slate-400">Budget</span>
                      <span className="font-semibold text-cyan-400">₹{budget}/mo</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-slate-400">Appliances</span>
                      <span className="font-semibold">{Object.values(selectedApps).filter(v => v).length} selected</span>
                   </div>
                </div>

                <NavButton onClick={handleFinish} label="Go to My Dashboard →" primary />
              </div>
            </WizardSlide>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Wizard Helpers
const WizardSlide = ({ children, onAnimationComplete }) => (
  <motion.div
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -50 }}
    transition={{ duration: 0.4 }}
    className="w-full"
    onAnimationComplete={onAnimationComplete}
  >
    {children}
  </motion.div>
);

const NavButton = ({ onClick, label, secondary, primary, disabled }) => {
  let styles = "px-8 py-3 rounded-full font-bold transition-all ";
  if (primary) styles += "bg-cyan-600 text-white hover:bg-cyan-500 shadow-lg";
  if (secondary) styles += "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700";
  if (disabled) styles += " opacity-50 cursor-not-allowed";

  return (
    <button onClick={onClick} disabled={disabled} className={styles}>
      {label}
    </button>
  );
};

const StepperNav = ({ onBack, onNext, validate }) => (
  <div className="flex justify-between items-center mt-8 pt-8 border-t border-slate-800">
     <NavButton onClick={onBack} label="← Back" secondary />
     <NavButton onClick={onNext} label="Next Step →" primary disabled={!validate} />
  </div>
);
