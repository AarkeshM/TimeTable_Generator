import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Menu, Home, Calendar, User, BookCopy, GraduationCap,
  X, PlusCircle, Loader2, LogOut, Code, Hash, TrendingUp, AlertTriangle, Hand, BookOpen, ChevronRight, Layers
} from "lucide-react";

// --- Configuration ---
const API_BASE_URL = "http://localhost:5000/api";
const YEAR_OPTIONS = ["I", "II", "III", "IV"];

// ----------------------- MAIN COMPONENT ----------------------- //
export default function StaffDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [staff, setStaff] = useState(null);
  
  // This state will hold ONLY the courses belonging to the logged-in user
  const [courses, setCourses] = useState([]);
  
  const [regularForm, setRegularForm] = useState({ name: "", code: "", acronym: "", year: "" });
  const [electiveForm, setElectiveForm] = useState({ name: "", code: "", acronym: "", year: "" });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!userData || !token) {
      return navigate("/login");
    }

    const parsedUser = JSON.parse(userData);
    setStaff(parsedUser);
    
    // Pass the user object to the fetch function so we can filter immediately
    fetchAllCourses(token, parsedUser);
  }, [navigate]);

  // --- ROBUST FETCH & FILTER FUNCTION ---
  const fetchAllCourses = async (token, currentUser) => {
    try {
      // 1. Get current user ID safely
      const currentStaffId = currentUser._id || currentUser.id;
      
      console.log("Logged in Staff ID:", currentStaffId);

      // 2. Fetch both Core and Elective courses
      const [regularRes, electiveRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/courses`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/elective-courses`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      // --- Helper: Check if a course belongs to this user ---
      const isMyCourse = (course) => {
        // Backend might send ID in 'staffId', 'staff', or inside a populated object
        const courseStaffId = course.staffId || course.staff || course.faculty;
        
        // If it's an object (populated), get the _id inside it
        const finalId = (typeof courseStaffId === 'object' && courseStaffId !== null) 
            ? (courseStaffId._id || courseStaffId.id) 
            : courseStaffId;

        // Convert both to strings for safe comparison (fixes ObjectId vs String issues)
        return String(finalId) === String(currentStaffId);
      };

      // 3. Process Core Courses
      const rawRegular = regularRes.data.courses || regularRes.data || [];
      const myRegularCourses = (Array.isArray(rawRegular) ? rawRegular : [])
        .filter(isMyCourse)
        .map(c => ({ ...c, courseType: 'Core' }));

      // 4. Process Elective Courses
      const rawElective = electiveRes.data.electives || electiveRes.data || [];
      const myElectiveCourses = (Array.isArray(rawElective) ? rawElective : [])
        .filter(isMyCourse)
        .map(c => ({ ...c, courseType: 'Elective' }));

      // 5. Merge & Sort (Newest first)
      const mergedCourses = [...myElectiveCourses, ...myRegularCourses].sort((a, b) => 
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );

      console.log(`Found ${mergedCourses.length} courses for user ${currentStaffId}`);
      setCourses(mergedCourses);

    } catch (err) {
      console.error("Fetch error details:", err);
      // Don't show error to UI if it's just empty, only if network fails
      if(err.response) setError("Failed to verify course data.");
    }
  };

  // --- Handlers for Regular Course ---
  const handleRegularChange = (e) =>
    setRegularForm({ ...regularForm, [e.target.name]: e.target.value });

  const handleAddRegularCourse = async (e) => {
    e.preventDefault();
    await submitCourse(regularForm, setRegularForm, `${API_BASE_URL}/courses/add`, "Core");
  };

  // --- Handlers for Elective Course ---
  const handleElectiveChange = (e) =>
    setElectiveForm({ ...electiveForm, [e.target.name]: e.target.value });

  const handleAddElectiveCourse = async (e) => {
    e.preventDefault();
    await submitCourse(electiveForm, setElectiveForm, `${API_BASE_URL}/elective-courses/add`, "Elective");
  };

  // --- Shared Submission Logic ---
  const submitCourse = async (formData, setFormData, endpoint, typeLabel) => {
    setError("");

    if (!formData.name || !formData.code || !formData.acronym || !formData.year)
      return setError("All fields are required.");

    if (!staff) return setError("Staff profile not loaded. Please refresh.");

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const staffId = staff._id || staff.id;

      // Ensure we send the ID exactly as backend expects
      const payload = {
        ...formData,
        staffId: staffId
      };

      const res = await axios.post(
        endpoint,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Optimistically add to list so user sees it immediately
      const newCourseData = res.data.course || res.data.elective || res.data;
      
      // Ensure the new object has the ID so it doesn't get filtered out if we re-filter
      const newCourseWithId = { 
          ...newCourseData, 
          staffId: staffId, 
          courseType: typeLabel 
      };
      
      setCourses((prev) => [newCourseWithId, ...prev]);
      setFormData({ name: "", code: "", acronym: "", year: "" }); 
      
    } catch (err) {
      console.error("Add course error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to add course.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", icon: Home, href: "/staff" },
    { name: "My Timetable", icon: Calendar, href: "/staff/timetable" },
    { name: "Courses", icon: BookCopy, href: "/staff/courses" },
    { name: "Profile", icon: User, href: "/staff/profile" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 flex font-sans selection:bg-blue-100 selection:text-blue-900">
      <Sidebar navItems={navItems} staff={staff} handleLogout={handleLogout} />
      <MobileSidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        navItems={navItems}
        staff={staff}
        handleLogout={handleLogout}
      />

      <div className="flex-1 lg:pl-72 transition-all duration-300">
        <header className="lg:hidden sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200/80 z-30 px-4 h-16 flex items-center justify-between shadow-sm">
          <Link to="/staff" className="flex items-center gap-2 font-bold text-lg text-slate-800">
            <div className="p-1.5 bg-blue-600 rounded-lg text-white shadow-sm"><GraduationCap size={20} /></div>
            <span>Acad Scheduler</span>
          </Link>
          <button onClick={() => setSidebarOpen(true)} className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <Menu size={24} />
          </button>
        </header>

        <main className="p-4 sm:p-8 lg:p-12 space-y-10 max-w-[1400px] mx-auto">
          <WelcomeHeader staffName={staff?.name} />

          <div className="space-y-8">
            <CourseForm
                title="Core Course Registration"
                subtitle="Add a main subject to your teaching schedule."
                icon={BookCopy}
                form={regularForm}
                handleChange={handleRegularChange}
                handleSubmit={handleAddRegularCourse}
                loading={loading}
                accentColor="blue"
            />

            <CourseForm
                title="Elective Course Registration"
                subtitle="Add an optional or specialized subject."
                icon={BookOpen}
                form={electiveForm}
                handleChange={handleElectiveChange}
                handleSubmit={handleAddElectiveCourse}
                loading={loading}
                accentColor="indigo"
                isElective={true}
            />
          </div>
          
          <AnimatePresence>
            {error && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }}
                    className="text-red-600 p-4 bg-red-50/80 backdrop-blur-sm rounded-xl border border-red-200/80 flex items-center shadow-sm"
                >
                <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" /> 
                <span className="font-medium text-sm">{error}</span>
                </motion.div>
            )}
          </AnimatePresence>

          {/* This component displays ONLY the filtered courses */}
          <CoursesSection courses={courses} />
        </main>
      </div>
    </div>
  );
}

// ----------------------- SUB COMPONENTS ----------------------- //

const CoursesSection = ({ courses }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-3 text-slate-900">
                <div className="p-2 bg-blue-100/50 text-blue-600 rounded-lg"><Layers size={20} /></div>
                My Registered Courses
            </h3>
            {courses?.length > 0 && <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{courses.length} Total</span>}
        </div>
        
        <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-200/60 overflow-hidden">
            {courses?.length === 0 && (
                <div className="text-center p-12">
                    <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <BookCopy className="w-8 h-8 text-slate-300" />
                        </div>
                        <h4 className="text-slate-900 font-medium mb-2">No registered courses found</h4>
                        <p className="text-slate-500 text-sm">Add a Core or Elective course above to see it here.</p>
                    </div>
                </div>
            )}

            {courses?.length > 0 && (
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50/50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Course Name</th>
                            <th className="px-6 py-4 font-semibold">Type</th>
                            <th className="px-6 py-4 font-semibold">Code</th>
                            <th className="px-6 py-4 font-semibold">Acronym</th>
                            <th className="px-6 py-4 font-semibold">Year Level</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {courses.map((c) => (
                            <tr key={c._id || c.code} className="bg-white transition-colors hover:bg-slate-50/50 group">
                                <td className="px-6 py-4 font-medium text-slate-900">{c.name}</td>
                                <td className="px-6 py-4">
                                    {c.courseType === "Elective" ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                           Elective
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                           Core
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4"><span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-md text-slate-700">{c.code}</span></td>
                                <td className="px-6 py-4 text-slate-600">{c.acronym}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        Year {c.year}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            )}

            {/* Mobile Cards */}
            <div className="md:hidden p-4 space-y-4 bg-slate-50/50">
                {courses?.map((c) => (
                    <motion.div
                        key={c._id || c.code}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm relative overflow-hidden"
                    >
                        <div className={`absolute top-0 left-0 w-1 h-full ${c.courseType === 'Elective' ? 'bg-indigo-500' : 'bg-blue-500'}`}></div>
                        <div className="flex items-start justify-between mb-3 pl-2">
                            <div>
                                <h4 className="text-base font-bold text-slate-900 leading-tight">{c.name}</h4>
                                <div className="flex items-center gap-2 mt-2">
                                     <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-md text-slate-700 font-medium">{c.code}</span>
                                     <span className="text-slate-300">•</span>
                                     <span className="text-sm text-slate-500 font-medium">{c.acronym}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-md ${c.courseType === 'Elective' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {c.courseType}
                                </span>
                                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                    Yr {c.year}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    </motion.div>
);

const WelcomeHeader = ({ staffName }) => (
  <motion.div 
    initial={{ opacity: 0, y: -10 }} 
    animate={{ opacity: 1, y: 0 }} 
    className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
    <div className="relative z-10">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 flex items-center gap-3">
        Hello, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">{staffName?.split(' ') || "Staff"}</span> 
        <motion.div
            animate={{ rotate: [0, 15, -10, 15, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
            className="origin-bottom-right" 
        >
            <Hand className="w-8 h-8 text-amber-500/80" fill="currentColor" />
        </motion.div>
        </h2>
        <p className="text-slate-500 mt-3 text-lg max-w-2xl leading-relaxed">
        Welcome back to your dashboard. Manage your courses and schedule efficiently.
        </p>
    </div>
  </motion.div>
);

const CourseForm = ({ title, subtitle, icon: TitleIcon, form, handleChange, handleSubmit, loading, accentColor, isElective = false }) => {
  const bgColorClass = isElective ? "bg-indigo-50/30 border-indigo-100/50" : "bg-white border-slate-200/80";
  const iconColorClass = isElective ? "text-indigo-600 bg-indigo-100/50" : "text-blue-600 bg-blue-100/50";
  const buttonBaseClass = isElective ? `bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-200` : `bg-blue-600 hover:bg-blue-700 focus:ring-blue-200`;

  return (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
    <div className={`rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border ${bgColorClass} overflow-hidden relative`}>
        <div className={`absolute top-0 inset-x-0 h-1 ${isElective ? 'bg-indigo-500/20' : 'bg-blue-500/20'}`}></div>
      <div className="p-6 md:p-8">
        <div className="mb-8 flex items-start gap-4">
          <div className={`p-3 rounded-xl ${iconColorClass} shadow-sm`}>
              <TitleIcon className="w-6 h-6" />
          </div>
          <div>
              <h3 className="text-xl font-bold text-slate-900">{title}</h3>
              <p className="text-slate-500 text-sm mt-1 leading-relaxed">{subtitle}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-6 lg:col-span-5">
              <InputField 
                label="Course Name" name="name" value={form.name} onChange={handleChange} 
                icon={BookCopy} placeholder="e.g., Advanced Machine Learning" accentColor={accentColor}
              />
          </div>
          <div className="md:col-span-3 lg:col-span-3">
            <InputField 
                label="Code" name="code" value={form.code} onChange={handleChange} 
                icon={Code} placeholder="e.g., CS405" accentColor={accentColor}
            />
          </div>
          <div className="md:col-span-3 lg:col-span-2">
            <InputField 
                label="Acronym" name="acronym" value={form.acronym} onChange={handleChange} 
                icon={Hash} placeholder="e.g., AML" accentColor={accentColor}
            />
          </div>
          <div className="md:col-span-6 lg:col-span-2">
              <SelectField
                label="Year Level" name="year" value={form.year} onChange={handleChange} options={YEAR_OPTIONS}
                icon={GraduationCap} accentColor={accentColor}
              />
          </div>
           <div className="md:col-span-6 lg:col-span-12 flex justify-end mt-2">
              <motion.button
                whileHover={{ scale: 1.02, translateY: -1 }} whileTap={{ scale: 0.98 }}
                type="submit" disabled={loading}
                className={`px-8 py-3.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg text-white flex items-center justify-center focus:ring-4 ${loading ? "bg-slate-400 shadow-none cursor-not-allowed" : buttonBaseClass}`}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <><PlusCircle className="w-5 h-5 mr-2" /> <span>Add Course</span></>}
              </motion.button>
          </div>
        </form>
      </div>
    </div>
  </motion.div>
)};

const InputField = ({ label, icon: Icon, accentColor = "blue", ...props }) => {
  const focusRingClass = accentColor === "indigo" ? "focus:ring-indigo-500/20 focus:border-indigo-500" : "focus:ring-blue-500/20 focus:border-blue-500";
  const iconColorClass = accentColor === "indigo" ? "text-indigo-500" : "text-blue-500";
  return (
  <div className="flex flex-col">
    <label className="text-sm font-semibold text-slate-700 flex items-center mb-2 gap-2">
      {Icon && <Icon className={`w-4 h-4 ${iconColorClass}`} />} {label}
    </label>
    <input {...props} className={`w-full p-3.5 border border-slate-200 rounded-xl bg-slate-50/30 text-slate-900 placeholder:text-slate-400 transition-all duration-200 ease-in-out focus:bg-white focus:ring-4 ${focusRingClass} focus:outline-none shadow-sm`} />
  </div>
)};

const SelectField = ({ label, name, value, onChange, options, icon: Icon, className, accentColor = "blue" }) => {
    const focusRingClass = accentColor === "indigo" ? "focus:ring-indigo-500/20 focus:border-indigo-500" : "focus:ring-blue-500/20 focus:border-blue-500";
    const iconColorClass = accentColor === "indigo" ? "text-indigo-500" : "text-blue-500";
    return (
  <div className={`flex flex-col ${className}`}>
    <label className="text-sm font-semibold text-slate-700 flex items-center mb-2 gap-2">
      {Icon && <Icon className={`w-4 h-4 ${iconColorClass}`} />} {label}
    </label>
    <div className="relative">
        <select name={name} value={value} onChange={onChange} className={`w-full p-3.5 border border-slate-200 rounded-xl bg-slate-50/30 text-slate-900 transition-all duration-200 ease-in-out focus:bg-white focus:ring-4 ${focusRingClass} focus:outline-none shadow-sm appearance-none cursor-pointer pr-10`}>
        <option value="" disabled>Select {label}</option>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400"><ChevronRight className="w-5 h-5 rotate-90" /></div>
    </div>
  </div>
)};

const Sidebar = ({ navItems, staff, handleLogout }) => {
  const location = useLocation();
  return (
    <aside className="hidden lg:flex flex-col w-72 fixed inset-y-0 bg-white/90 backdrop-blur-md border-r border-slate-200/80 z-20">
      <div className="h-20 flex items-center px-8">
          <Link to="/staff" className="flex items-center gap-3 font-bold text-xl text-slate-900 transition-opacity hover:opacity-80">
             <div className="p-2 bg-blue-600 rounded-xl text-white shadow-sm"><GraduationCap size={24} /></div>
             <span className="tracking-tight">Acad Scheduler</span>
          </Link>
      </div>
      <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
        <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Main Menu</p>
        {navItems.map((item) => {
           const isActive = location.pathname === item.href;
           return (
          <Link key={item.name} to={item.href} className={`group flex items-center gap-3 px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 relative ${isActive ? "text-blue-700 bg-blue-50/80" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
            {isActive && <motion.div layoutId="activePill" className="absolute left-0 w-1.5 h-8 bg-blue-600 rounded-r-full" />}
            <item.icon size={20} className={`transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
            {item.name}
          </Link>
        )})}
      </nav>
      <div className="p-4 m-4 bg-slate-50/80 rounded-2xl border border-slate-100/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"><User className="text-slate-600 w-5 h-5" /></div>
          <div className="overflow-hidden flex-1">
            <p className="font-bold text-sm text-slate-900 truncate">{staff?.name || "Staff Member"}</p>
            <p className="text-xs text-slate-500 truncate">{staff?.email || "Email"}</p>
          </div>
          <button onClick={handleLogout} className="p-2 rounded-lg text-slate-400 hover:bg-white hover:text-red-600 hover:shadow-sm transition-all" title="Logout"><LogOut size={18} /></button>
        </div>
      </div>
    </aside>
  );
};

const MobileSidebar = ({ isOpen, setIsOpen, navItems, staff, handleLogout }) => {
  const location = useLocation();
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsOpen(false)} />
          <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 flex flex-col lg:hidden shadow-2xl">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
              <span className="font-bold text-lg text-slate-900">Menu</span>
              <button onClick={() => setIsOpen(false)} className="p-2 -mr-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"><X size={20} /></button>
            </div>
            <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                 const isActive = location.pathname === item.href;
                 return (
                <Link key={item.name} to={item.href} onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                  <item.icon size={20} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                  {item.name}
                </Link>
              )})}
            </nav>
            <div className="p-4 border-t border-slate-100">
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition font-semibold text-sm"><LogOut size={18} /> Logout</button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};