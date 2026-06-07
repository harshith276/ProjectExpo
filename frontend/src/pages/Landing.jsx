import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Zap, Activity, BrainCircuit, Home, CheckCircle2, Star, Menu, X } from 'lucide-react';

const FloatingOrb = ({ delay, duration, xStart, yStart, size, color }) => (
  <motion.div
    className={`absolute rounded-full opacity-20 blur-3xl ${color}`}
    style={{ width: size, height: size, left: xStart, top: yStart }}
    animate={{ y: [0, -50, 0], x: [0, 30, 0], scale: [1, 1.1, 1] }}
    transition={{ duration: duration, repeat: Infinity, ease: 'easeInOut', delay }}
  />
);

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="bg-[#0b0f19] min-h-screen text-white font-sans overflow-x-hidden selection:bg-cyan-500 selection:text-white">
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 top-0 bg-[#0b0f19]/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="text-cyan-500 w-8 h-8" />
            <span className="text-2xl font-bold tracking-tight">VoltVision AI</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/login" className="text-slate-300 hover:text-white font-medium transition-colors">Sign In</Link>
            <Link to="/signup" className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-full font-semibold transition-all hover:shadow-[0_0_15px_rgba(34,211,238,0.5)]">
              Get Started Free
            </Link>
          </div>
          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X/> : <Menu/>}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#111827] border-b border-slate-800 p-4 flex flex-col gap-4">
             <Link to="/login" className="w-full text-center py-2 text-slate-300">Sign In</Link>
             <Link to="/signup" className="w-full text-center bg-cyan-600 py-2 rounded-lg text-white font-semibold">Get Started Free</Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
        <FloatingOrb delay={0} duration={8} xStart="-5%" yStart="10%" size="400px" color="bg-cyan-600" />
        <FloatingOrb delay={2} duration={10} xStart="70%" yStart="40%" size="500px" color="bg-emerald-600" />
        <FloatingOrb delay={1} duration={7} xStart="30%" yStart="-10%" size="300px" color="bg-blue-600" />

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <div className="flex-1 text-center lg:text-left">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight mb-6"
            >
              Take Control of <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Electricity Consumption.</span>
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
            >
              <h2 className="text-2xl text-slate-300 font-medium mb-4">Monitor. Predict. Save.</h2>
              <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto lg:mx-0">
                VoltVision AI tracks your real-time power consumption, predicts your monthly bill, and helps you save money automatically.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link to="/signup">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-cyan-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-[0_0_20px_rgba(34,211,238,0.4)] w-full sm:w-auto">
                    Get Started Free
                  </motion.button>
                </Link>
                <Link to="/login">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-slate-800 text-white px-8 py-4 rounded-full font-bold text-lg border border-slate-700 hover:bg-slate-700 w-full sm:w-auto">
                    See Live Demo
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex-1 relative hidden md:block"
          >
            <div className="w-full aspect-square relative flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 rounded-full animate-pulse blur-3xl"></div>
              <Activity className="w-64 h-64 text-cyan-400 relative z-10 animate-bounce" style={{animationDuration: '3s'}} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-24 bg-[#0d1323] relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Powerful analytics engineered to reduce your carbon footprint and save your wallet.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FeatureCard 
              icon={<Activity className="text-cyan-400 w-8 h-8" />}
              title="Real-Time Monitoring"
              desc="Watch your power usage update live every 5 seconds via WebSocket."
              delay={0.1}
            />
            <FeatureCard 
              icon={<Zap className="text-emerald-400 w-8 h-8" />}
              title="Smart Analytics"
              desc="Daily and weekly charts built from your real recorded usage data."
              delay={0.2}
            />
            <FeatureCard 
              icon={<BrainCircuit className="text-purple-400 w-8 h-8" />}
              title="AI Energy Advisor"
              desc="Get personalized tips to reduce your electricity bill intelligently."
              delay={0.3}
            />
            <FeatureCard 
              icon={<Home className="text-blue-400 w-8 h-8" />}
              title="Appliance Simulator"
              desc="Simulate turning on appliances and see instant bill impact mathematically."
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 px-6 relative">
         <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-20">How VoltVision Works</h2>
            <div className="relative flex flex-col md:flex-row justify-between gap-12">
               {/* Dotted Line */}
               <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 border-t-2 border-dashed border-slate-700 z-0"></div>
               
               <Step number="1" title="Create Your Account" desc="Sign up free in 30 seconds" delay={0.1} />
               <Step number="2" title="Complete Your Profile" desc="Tell us about your home and budget" delay={0.3} />
               <Step number="3" title="Monitor & Save" desc="Watch your dashboard come alive with real energy insights" delay={0.5} />
            </div>
         </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-gradient-to-b from-[#0b0f19] to-[#05080f] border-t border-slate-800/50">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <StatBox number="5 Second" label="Update Frequency" />
            <StatBox number="100%" label="Real Data, No Fakes" />
            <StatBox number="24/7" label="Live Monitoring" />
            <StatBox number="₹0" label="Free to Use" />
         </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-[#05080f]">
         <h2 className="text-4xl font-bold text-center mb-16">Trusted by Homeowners</h2>
         <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <Testimonial name="Sarah J." role="Apartment Renter" quote="VoltVision completely changed how I use my AC. I saved $40 in my first month just by tracking the live projections!" />
            <Testimonial name="Mark T." role="Homeowner" quote="The appliance simulator is pure genius. I now know exactly how much my gaming PC costs me per night." />
            <Testimonial name="Elena R." role="Eco-Enthusiast" quote="Finally an app that gives real-time telemetry instead of end-of-month surprises. Absolutely stunning UI." />
         </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-black border-t border-slate-800 text-slate-500 text-sm text-center">
         <div className="flex items-center justify-center gap-2 mb-4 text-white">
            <Zap className="w-5 h-5 text-cyan-500" />
            <span className="font-bold text-lg tracking-wide">VoltVision AI</span>
         </div>
         <div className="flex justify-center gap-6 mb-8">
            <a href="#" className="hover:text-cyan-400">Features</a>
            <a href="#" className="hover:text-cyan-400">Pricing</a>
            <a href="#" className="hover:text-cyan-400">About</a>
            <a href="#" className="hover:text-cyan-400">Contact</a>
         </div>
         <p>© 2026 VoltVision AI. All rights reserved.</p>
      </footer>
    </div>
  );
}

// Subcomponents
const FeatureCard = ({ icon, title, desc, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ y: -10 }}
    className="bg-slate-800/40 border border-slate-700/50 p-8 rounded-3xl backdrop-blur-sm"
  >
    <div className="bg-slate-900 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-inner">{icon}</div>
    <h3 className="text-2xl font-bold mb-3">{title}</h3>
    <p className="text-slate-400 leading-relaxed">{desc}</p>
  </motion.div>
);

const Step = ({ number, title, desc, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.6 }}
    className="flex flex-col items-center text-center relative z-10 flex-1"
  >
    <div className="w-16 h-16 rounded-full bg-cyan-600 flex items-center justify-center text-2xl font-bold mb-6 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
      {number}
    </div>
    <h4 className="text-xl font-bold mb-2">{title}</h4>
    <p className="text-slate-400 text-sm max-w-[200px]">{desc}</p>
  </motion.div>
);

const StatBox = ({ number, label }) => (
   <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="p-6"
   >
      <div className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 mb-2">{number}</div>
      <div className="text-slate-400 font-medium tracking-wide uppercase text-xs">{label}</div>
   </motion.div>
);

const Testimonial = ({ name, role, quote }) => (
   <motion.div 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="bg-slate-900 border border-slate-800 p-8 rounded-2xl flex flex-col justify-between"
   >
      <div className="flex gap-1 mb-6 text-yellow-500">
         <Star className="w-4 h-4 fill-current"/>
         <Star className="w-4 h-4 fill-current"/>
         <Star className="w-4 h-4 fill-current"/>
         <Star className="w-4 h-4 fill-current"/>
         <Star className="w-4 h-4 fill-current"/>
      </div>
      <p className="text-slate-300 italic mb-8 flex-1">"{quote}"</p>
      <div className="flex items-center gap-3 border-t border-slate-800 pt-4">
         <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-600 to-purple-600"></div>
         <div>
            <div className="font-bold">{name}</div>
            <div className="text-xs text-slate-500">{role}</div>
         </div>
      </div>
   </motion.div>
);
