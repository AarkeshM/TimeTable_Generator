import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Mail, MapPin, Phone, Minus, Send } from "lucide-react";

// --- Sub-Components ---

// 1. Minimalist Underlined Input
// Uses a line at the bottom instead of a box for a cleaner "paper" feel
const UnderlinedInput = ({ label, name, type = "text", value, onChange, placeholder, required, isTextArea }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative mb-8 group">
      <label 
        className={`block text-xs font-bold uppercase tracking-widest mb-2 transition-colors duration-300 
        ${isFocused ? "text-stone-900" : "text-stone-400"}`}
      >
        {label} {required && "*"}
      </label>

      {isTextArea ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required={required}
          rows={3}
          className="w-full bg-transparent border-b-2 border-stone-200 py-3 text-stone-800 text-lg md:text-xl placeholder:text-stone-300 focus:outline-none focus:border-stone-800 transition-all resize-none font-serif"
          placeholder={placeholder}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required={required}
          className="w-full bg-transparent border-b-2 border-stone-200 py-3 text-stone-800 text-lg md:text-xl placeholder:text-stone-300 focus:outline-none focus:border-stone-800 transition-all font-serif"
          placeholder={placeholder}
        />
      )}
    </div>
  );
};

// 2. Info Block
const InfoBlock = ({ icon: Icon, label, value, href }) => (
  <a href={href || "#"} className="group block">
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 bg-stone-200 rounded-full group-hover:bg-amber-400 transition-colors duration-300">
        <Icon size={16} className="text-stone-700" />
      </div>
      <span className="text-xs font-bold uppercase tracking-widest text-stone-500">{label}</span>
    </div>
    <p className="text-lg md:text-xl font-serif text-stone-800 border-b border-transparent group-hover:border-stone-300 inline-block transition-all">
      {value}
    </p>
  </a>
);

// --- Main Component ---

export default function EditorialContact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: "", email: "", message: "" });
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-800 font-sans selection:bg-stone-800 selection:text-white relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-2 bg-stone-900" />
      <div className="absolute top-0 right-10 md:right-40 w-[1px] h-screen bg-stone-200 hidden lg:block" />
      
      {/* Navbar Placeholder */}
      <nav className="absolute top-0 left-0 w-full p-6 md:p-10 flex justify-between items-center z-20">
        <div className="text-xl font-serif font-bold tracking-tighter">AcadAI.</div>
        <a href="/" className="text-xs font-bold uppercase tracking-widest hover:text-amber-600 transition-colors">
          Back Home
        </a>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20 md:pt-40">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-24">
          
          {/* --- Left Column: Impact Text & Info (Desktop: 5 cols) --- */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className="lg:col-span-5 flex flex-col justify-between h-full"
          >
            <div>
              <div className="flex items-center gap-4 mb-8">
                 <Minus className="w-12 h-px bg-stone-400" />
                 <span className="text-xs font-bold uppercase tracking-widest text-stone-500">Contact Us</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-serif leading-[0.9] text-stone-900 mb-8">
                Let’s start a <br/>
                <span className="italic text-stone-500">conversation.</span>
              </h1>
              
              <p className="text-stone-600 text-lg leading-relaxed max-w-sm">
                We help institutions optimize their schedules. Tell us about your department's needs.
              </p>
            </div>

            {/* Desktop Contact Info (Hidden on mobile to move to bottom) */}
            <div className="hidden lg:flex flex-col gap-10 mt-20">
              <InfoBlock icon={Mail} label="Email" value="hello@acadai.com" href="mailto:hello@acadai.com" />
              <InfoBlock icon={Phone} label="Phone" value="+1 (555) 012-3456" />
              <InfoBlock icon={MapPin} label="Office" value="123 Education Lane, NY" />
            </div>
          </motion.div>


          {/* --- Right Column: The Form (Desktop: 7 cols) --- */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "circOut" }}
            className="lg:col-span-7 pt-4 lg:pt-12"
          >
            <div className="bg-white p-8 md:p-16 shadow-[20px_20px_0px_0px_rgba(231,229,228,1)] border border-stone-100">
              
              <form onSubmit={handleSubmit} className="flex flex-col">
                <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                   <UnderlinedInput 
                      label="Your Name" 
                      name="name" 
                      placeholder="Jane Doe"
                      value={formData.name} 
                      onChange={handleChange} 
                      required 
                   />
                   <UnderlinedInput 
                      label="Email Address" 
                      name="email" 
                      type="email" 
                      placeholder="jane@college.edu"
                      value={formData.email} 
                      onChange={handleChange} 
                      required 
                   />
                </div>

                {/* Subject Selector (Custom Minimal) */}
                <div className="mb-12">
                   <label className="block text-xs font-bold uppercase tracking-widest mb-4 text-stone-400">
                     I'm interested in
                   </label>
                   <div className="flex flex-wrap gap-3">
                      {["Deployment", "Pricing", "Support", "Other"].map((tag) => (
                        <label key={tag} className="cursor-pointer">
                           <input type="radio" name="subject" className="peer sr-only" />
                           <span className="px-6 py-2 border border-stone-200 text-stone-500 rounded-full text-sm hover:border-stone-800 hover:text-stone-900 peer-checked:bg-stone-900 peer-checked:text-white peer-checked:border-stone-900 transition-all">
                             {tag}
                           </span>
                        </label>
                      ))}
                   </div>
                </div>

                <UnderlinedInput 
                   label="Message" 
                   name="message" 
                   isTextArea
                   placeholder="Tell us about your requirements..."
                   value={formData.message} 
                   onChange={handleChange} 
                   required 
                />

                <div className="mt-8 flex justify-end">
                  <button 
                    disabled={isSubmitted}
                    className="group relative inline-flex items-center gap-3 text-lg font-serif font-bold text-stone-900 overflow-hidden"
                  >
                    <span className={`transition-all duration-500 ${isSubmitted ? '-translate-y-10 opacity-0' : 'translate-y-0'}`}>
                      Send Inquiry
                    </span>
                    
                    <div className={`absolute left-0 transition-all duration-500 ${isSubmitted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} text-green-600`}>
                      Message Sent
                    </div>

                    <div className={`w-12 h-12 bg-stone-900 rounded-full flex items-center justify-center text-white transition-all duration-300 group-hover:scale-110 group-hover:bg-amber-500 ${isSubmitted ? 'bg-green-600 scale-110' : ''}`}>
                       {isSubmitted ? <ArrowRight className="w-5 h-5 -rotate-90" /> : <ArrowRight className="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />}
                    </div>
                  </button>
                </div>

              </form>
            </div>

            {/* Mobile Contact Info (Shows only on small screens) */}
            <div className="lg:hidden grid grid-cols-1 gap-8 mt-16 border-t border-stone-200 pt-10">
              <InfoBlock icon={Mail} label="Email" value="hello@acadai.com" href="mailto:hello@acadai.com" />
              <InfoBlock icon={Phone} label="Phone" value="+1 (555) 012-3456" />
            </div>

          </motion.div>
        </div>
      </main>
    </div>
  );
}