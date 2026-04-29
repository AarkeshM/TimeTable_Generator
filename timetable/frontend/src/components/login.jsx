import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Mail, Lock, User, Phone, Building, Loader2, ArrowLeft, GraduationCap, 
  ChevronRight, BookOpen, Clock, Calendar, Layout, Library, Trophy, 
  Bell, Atom, Calculator, FlaskConical, Globe, Sigma, PenTool, Target, Languages
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

// --- Colorful Floating Icons Background ---
const FloatingBackground = () => {
  const academicIcons = [
    { Icon: BookOpen, color: "text-blue-500" },
    { Icon: Clock, color: "text-amber-500" },
    { Icon: GraduationCap, color: "text-indigo-600" },
    { Icon: Atom, color: "text-purple-500" },
    { Icon: Calculator, color: "text-emerald-500" },
    { Icon: FlaskConical, color: "text-rose-500" },
    { Icon: Globe, color: "text-cyan-500" },
    { Icon: Sigma, color: "text-orange-500" },
    { Icon: PenTool, color: "text-pink-500" },
    { Icon: Target, color: "text-red-500" },
    { Icon: Library, color: "text-blue-600" },
    { Icon: Languages, color: "text-violet-500" },
  ];

  // Generating 20 unique floating elements
  const floatingElements = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    ...academicIcons[i % academicIcons.length],
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.floor(Math.random() * (32 - 20 + 1) + 20),
    duration: Math.random() * 10 + 20,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-slate-50/50">
      {floatingElements.map((item) => (
        <motion.div
          key={item.id}
          // Opacity is set to 40% for better contrast in light theme
          className={`absolute ${item.color} opacity-40`} 
          initial={{ y: 0, x: 0, rotate: 0 }}
          animate={{
            y: [0, -120, 0],
            x: [0, 60, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            delay: item.delay,
            ease: "linear",
          }}
          style={{ top: item.top, left: item.left }}
        >
          <item.Icon size={item.size} strokeWidth={2.5} />
        </motion.div>
      ))}
    </div>
  );
};

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loginAs, setLoginAs] = useState("staff");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "", mobile: "", email: "", department: "", role: "staff", password: "", confirmPassword: "",
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");

    if (isLogin) {
      try {
        const { data } = await axios.post("http://localhost:5000/api/login", {
          email: formData.email, password: formData.password, loginAs,
        });
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setSuccess("Success! Moving to dashboard...");
        setTimeout(() => navigate(data.user.role === "admin" ? "/admin" : "/staff"), 1200);
      } catch (err) { setError("Check your email and password."); }
      finally { setLoading(false); }
    } else {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords mismatch"); setLoading(false); return;
      }
      try {
        await axios.post("http://localhost:5000/api/register", formData);
        setSuccess("Account created! Logging in...");
        setTimeout(() => setIsLogin(true), 1200);
      } catch { setError("Registration failed."); }
      finally { setLoading(false); }
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-8 overflow-hidden bg-white">
      
      {/* Background with multiple colored icons */}
      <FloatingBackground />

      {/* Subtle Dot Mesh */}
      <div className="absolute inset-0 opacity-[0.1] pointer-events-none" 
           style={{ backgroundImage: `radial-gradient(#475569 1px, transparent 1px)`, backgroundSize: '30px 30px' }}>
      </div>

      <div className="relative z-10 w-full max-w-[440px]">
        
        {/* Back Link */}
        <div className="mb-6">
          <Link to="/" className="text-slate-500 hover:text-blue-600 flex items-center gap-2 transition-all w-fit group font-bold text-sm">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
            Back to Home
          </Link>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center justify-center p-4 bg-white border-2 border-slate-50 rounded-3xl shadow-xl shadow-slate-200 mb-4"
          >
            <GraduationCap size={40} className="text-blue-600" />
          </motion.div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Academic<span className="text-blue-600">Scheduler</span>
          </h1>
          <p className="text-slate-500 text-sm font-bold mt-1">Smart Campus Planning AI</p>
        </div>

        {/* Modern Glassy Card */}
        <motion.div 
          initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="bg-white/80 backdrop-blur-xl p-6 sm:p-10 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white"
        >
          {/* Staff/Admin Toggle */}
          {isLogin && (
            <div className="relative flex bg-slate-100 p-1.5 rounded-2xl mb-8">
              <motion.div 
                animate={{ x: loginAs === "staff" ? "0%" : "100%" }}
                className="absolute h-[calc(100%-12px)] w-[calc(50%-6px)] bg-white rounded-xl shadow-sm"
              />
              <button onClick={() => setLoginAs("staff")}
                className={`relative z-10 w-1/2 py-2.5 text-sm font-black transition-colors ${loginAs === "staff" ? "text-blue-600" : "text-slate-500"}`}>
                Staff
              </button>
              <button onClick={() => setLoginAs("admin")}
                className={`relative z-10 w-1/2 py-2.5 text-sm font-black transition-colors ${loginAs === "admin" ? "text-blue-600" : "text-slate-500"}`}>
                Admin
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.form 
              key={isLogin ? "L" : "R"}
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              onSubmit={handleSubmit} className="space-y-4"
            >
              {!isLogin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input icon={User} name="name" placeholder="Full Name" onChange={handleChange} required />
                  <Input icon={Phone} name="mobile" placeholder="Mobile" onChange={handleChange} required />
                </div>
              )}
              <Input icon={Mail} name="email" type="email" placeholder="Email Address" onChange={handleChange} required />
              {!isLogin && <Input icon={Building} name="department" placeholder="Department" onChange={handleChange} required />}
              <Input icon={Lock} name="password" type="password" placeholder="Password" onChange={handleChange} required />
              {!isLogin && <Input icon={Lock} name="confirmPassword" type="password" placeholder="Confirm" onChange={handleChange} required />}

              <button disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 py-4 rounded-2xl text-white font-black shadow-lg shadow-blue-100 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 mt-4">
                {loading ? <Loader2 className="animate-spin" /> : <>{isLogin ? "Sign In" : "Create Account"} <ChevronRight size={18} /></>}
              </button>
            </motion.form>
          </AnimatePresence>

          {/* Feedback */}
          <div className="h-4 mt-4 text-center">
            {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
            {success && <p className="text-green-600 text-xs font-bold">{success}</p>}
          </div>

          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <p className="text-slate-500 text-sm font-bold">
              {isLogin ? "New here?" : "Already a member?"}
              <button onClick={() => { setIsLogin(!isLogin); setError(""); setSuccess(""); }} 
                className="text-blue-600 hover:text-blue-800 font-black ml-2 underline underline-offset-4">
                {isLogin ? "Register" : "Login"}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Reusable Input
const Input = ({ icon: Icon, ...props }) => (
  <div className="relative group">
    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
      <Icon size={18} strokeWidth={2.5} />
    </div>
    <input {...props}
      className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border-2 border-slate-100 text-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition-all placeholder:text-slate-400 text-sm font-bold"
    />
  </div>
);