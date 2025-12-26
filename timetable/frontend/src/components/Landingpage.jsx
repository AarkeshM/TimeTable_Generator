import React, { useState, useEffect } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Brain, Cpu, Layers, GraduationCap, ChevronRight,
  Activity, Sparkles, AlertCircle, CheckCircle2,
  Clock, ArrowRight, ShieldCheck, ScrollText, Menu, X
} from "lucide-react";

// --- Sub-Components ---

// 1. Premium Background (Silver Grid with Golden Glow)
const PremiumBackground = () => (
  <div className="fixed inset-0 z-0 pointer-events-none bg-[#F8FAFC]">
    {/* Clean Graph Paper Grid */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:30px_30px] opacity-30" />
    
    {/* Golden Ambient Light (Top Right & Bottom Left) */}
    <div className="absolute top-0 right-0 w-[80vw] h-[80vw] md:w-[600px] md:h-[600px] bg-amber-200/40 rounded-full blur-[120px] mix-blend-multiply opacity-60" />
    <div className="absolute bottom-0 left-0 w-[80vw] h-[80vw] md:w-[600px] md:h-[600px] bg-slate-300/40 rounded-full blur-[100px] mix-blend-multiply opacity-60" />
  </div>
);

// 2. Animated Schedule Processor (Visualizing the AI)
const ScheduleVisualizer = () => {
  const [step, setStep] = useState(0);
  const steps = [
    { text: "Ingesting Faculty Constraints...", color: "text-slate-600" },
    { text: "Detecting Lab Overlaps...", color: "text-amber-600" },
    { text: "Optimizing Room Allocation...", color: "text-slate-600" },
    { text: "Finalizing Master Timetable...", color: "text-green-600" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-2xl shadow-slate-300/50 overflow-hidden relative">
      <div className="bg-gradient-to-r from-slate-100 to-white px-4 py-3 border-b border-slate-200 flex justify-between items-center">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
        </div>
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">AcadAI Core v2.0</span>
      </div>
      
      <div className="p-6 h-48 flex flex-col justify-center items-start space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-center gap-3 font-mono text-sm md:text-base font-medium ${steps[step].color}`}
          >
            {step === 1 ? <AlertCircle className="w-5 h-5 animate-pulse" /> : <Activity className="w-5 h-5" />}
            {steps[step].text}
          </motion.div>
        </AnimatePresence>
        
        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-4">
          <motion.div 
            className="h-full bg-gradient-to-r from-amber-400 to-amber-600"
            animate={{ width: ["0%", "100%"] }}
            transition={{ duration: 2, ease: "linear", repeat: Infinity }}
          />
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component ---

export default function CollegeScheduler() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  return (
    <div className="min-h-screen text-slate-800 font-sans selection:bg-amber-100 selection:text-amber-900 overflow-x-hidden">
      <PremiumBackground />

      {/* --- Navigation --- */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/50 bg-white/70 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg shadow-lg shadow-amber-500/20">
              <GraduationCap className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <span className="font-bold text-lg md:text-xl tracking-tight text-slate-900">
              Acad<span className="text-amber-600">AI</span>
            </span>
          </div>
          
          {/* Desktop Links */}
          <div className="hidden md:flex gap-8 text-sm font-semibold text-slate-500">
            <a href="#features" className="hover:text-amber-600 transition-colors">Capabilities</a>
            <a href="#process" className="hover:text-amber-600 transition-colors">Process</a>
            <a href="#pricing" className="hover:text-amber-600 transition-colors">Institutions</a>
          </div>

          {/* Desktop Login Button */}
          <div className="hidden md:block">
            <a href="/login" className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-sm font-medium transition-all shadow-md hover:shadow-lg">
              Portal Login
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-slate-600"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="md:hidden bg-white border-b border-slate-200 overflow-hidden"
          >
            <div className="flex flex-col p-4 space-y-4 font-medium text-slate-600">
              <a href="#features" onClick={() => setIsMobileMenuOpen(false)}>Capabilities</a>
              <a href="#process" onClick={() => setIsMobileMenuOpen(false)}>Process</a>
              <a href="/login" className="text-amber-600 font-bold" onClick={() => setIsMobileMenuOpen(false)}>Portal Login</a>
            </div>
          </motion.div>
        )}
      </nav>

      {/* --- Hero Section --- */}
      <main className="relative z-10 pt-32 pb-16 md:pt-40 md:pb-24 px-4 md:px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Hero Text */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-amber-200 text-amber-700 text-[10px] md:text-xs font-bold tracking-wide mb-6 uppercase shadow-sm">
              <Sparkles className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span>Timetable Automation for Colleges</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-6">
              Create the <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-yellow-600 to-amber-700">
                Perfect Schedule.
              </span>
            </h1>

            <p className="text-base md:text-lg text-slate-600 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Stop using spreadsheets. Our AI solves conflicts between Labs, Electives, and Research hours in seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {/* UPDATED LINK */}
              <a 
                href="/login"
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-bold transition-all shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2"
              >
                Deploy for your Department <ArrowRight className="w-5 h-5" />
              </a>
              <button className="px-8 py-4 bg-white border border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-700 rounded-xl font-bold transition-all shadow-sm">
                How it works
              </button>
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative mt-8 lg:mt-0"
          >
            {/* Visual Blob Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-gradient-to-tr from-amber-100 to-slate-200 rounded-full blur-3xl -z-10" />
            
            <ScheduleVisualizer />
            
            {/* Stats Card */}
            <motion.div 
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-6 -right-2 md:-right-6 bg-white p-3 md:p-4 rounded-xl border border-slate-100 shadow-xl flex items-center gap-3 md:gap-4"
            >
              <div className="bg-amber-100 p-2 md:p-3 rounded-full">
                 <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />
              </div>
              <div>
                <div className="text-[10px] md:text-xs text-slate-400 font-semibold uppercase">Efficiency</div>
                <div className="text-lg md:text-xl font-bold text-slate-900">99.9%</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* --- Features Grid --- */}
      <section id="features" className="py-20 md:py-24 relative z-10 bg-white border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why Deans choose AcadAI</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-sm md:text-lg">
              Engineered specifically for the complex constraints of Degree Colleges and Engineering Institutes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: Layers,
                title: "Lab & Lecture Sync",
                desc: "Automatically blocks 3-hour lab sessions without conflicting with mandatory theory classes for the same batch."
              },
              {
                icon: ScrollText,
                title: "Faculty Constraints",
                desc: "Respects 'Research Hours' and PhD guidance slots. Professors only teach when they are truly available."
              },
              {
                icon: AlertCircle,
                title: "Elective Management",
                desc: "Solves the 'Elective Matrix'. Ensures students picking subjects from different departments never face a clash."
              },
              {
                icon: Cpu,
                title: "Room Optimization",
                desc: "Allocates lecture halls based on class size capacity, saving electricity and ensuring comfort."
              },
              {
                icon: Brain,
                title: "Smart Substitution",
                desc: "Faculty on leave? One click generates the best available substitute based on subject expertise."
              },
              {
                icon: Clock,
                title: "Instant Publishing",
                desc: "Generate PDF timetables for Notice Boards and sync directly to the Student Mobile App."
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200 hover:border-amber-400 hover:bg-white hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center mb-6 group-hover:bg-amber-50 transition-colors shadow-sm">
                  <item.icon className="w-6 h-6 text-slate-400 group-hover:text-amber-600 transition-colors" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA / Footer Section --- */}
      <section className="py-20 md:py-24 relative z-10 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl relative px-6 py-12 md:p-16 text-center md:text-left">
            {/* Decorative Glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-[80px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-900/40 rounded-full blur-[80px]" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="max-w-xl">
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Ready to modernize your Campus?
                </h3>
                <p className="text-slate-400 text-base md:text-lg mb-8">
                   Join the elite list of Institutes using AI to reclaim 100+ administrative hours per semester.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* UPDATED LINK */}
                  <a href="/login" className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-bold transition-all text-center">
                    Login to Dashboard
                  </a>
                  <a href="/contact" className="px-8 py-4 bg-transparent border border-slate-600 text-white hover:border-white rounded-xl font-bold transition-all text-center">
                    Contact Us
                  </a>
                </div>
              </div>
              
              {/* Simple Stats for Visual Balance */}
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 p-4 rounded-lg backdrop-blur-md text-center">
                      <div className="text-2xl font-bold text-white">45+</div>
                      <div className="text-xs text-slate-400">Colleges</div>
                  </div>
                  <div className="bg-white/10 p-4 rounded-lg backdrop-blur-md text-center">
                      <div className="text-2xl font-bold text-white">10k+</div>
                      <div className="text-xs text-slate-400">Schedules</div>
                  </div>
              </div>
            </div>
          </div>

          {/* Copyright Footer */}
          <div className="mt-16 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400 gap-4 border-t border-slate-200 pt-8">
             <p>© {new Date().getFullYear()} AcadAI (Aarkesh & Agalya). All rights reserved.</p>
             <div className="flex gap-6">
               <a href="#" className="hover:text-amber-600">Privacy</a>
               <a href="#" className="hover:text-amber-600">Terms</a>
               <a href="#" className="hover:text-amber-600">Support</a>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}