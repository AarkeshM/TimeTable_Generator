import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  LayoutDashboard, Users2, CalendarCheck, Settings, LogOut,
  GraduationCap, X, Plus, User, Loader2, Trash2, Sparkles, 
  Menu, BookOpen, Clock, ChevronRight, AlertCircle
} from "lucide-react";

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(null);

  // Data State
  const [staffAllocations, setStaffAllocations] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [allStaff, setAllStaff] = useState([]);

  // Form State
  const [form, setForm] = useState({ staffId: "", courseId: "", year: "", section: "", periods: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Generation State
  const [generating, setGenerating] = useState(false);
  
  const navigate = useNavigate();

  // --- AUTH CHECK ---
  useEffect(() => {
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role === "admin") {
        setAdmin(parsedUser);
        fetchInitialData(token);
      } else {
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // --- FILTER LOGIC ---
  const filteredCourses = allCourses.filter(course => {
    if (!form.staffId) return false;
    if (!course.CreatedBy) return false;
    const creatorId = course.CreatedBy._id || course.CreatedBy;
    return String(creatorId) === String(form.staffId);
  });

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "staffId") {
      setForm({ ...form, staffId: value, courseId: "", year: "" });
    } else if (name === "courseId") {
      const selectedCourse = allCourses.find(course => course._id === value);
      setForm({ 
        ...form, 
        courseId: value, 
        year: selectedCourse ? selectedCourse.year : "" 
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const fetchInitialData = async (token) => {
    try {
      const [coursesRes, staffRes, allocationsRes] = await Promise.all([
        axios.get("http://localhost:5000/api/courses", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("http://localhost:5000/api/staff", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("http://localhost:5000/api/allocations", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setAllCourses(coursesRes.data.courses || []);
      setAllStaff(staffRes.data.staff || []);
      setStaffAllocations(allocationsRes.data.allocations || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!form.staffId || !form.courseId || !form.year || !form.section || !form.periods) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post("http://localhost:5000/api/allocations", form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStaffAllocations([data.allocation, ...staffAllocations]);
      setForm({ staffId: "", courseId: "", year: "", section: "", periods: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add allocation.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllocation = async (id) => {
    if (!window.confirm("Delete this allocation?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/allocations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStaffAllocations(staffAllocations.filter((item) => item._id !== id));
    } catch (err) {
      alert("Failed to delete allocation.");
    }
  };

  const handleGenerateTimetable = async () => {
    if (!window.confirm("Generate new timetable based on current allocations?")) return;
    setGenerating(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post("http://localhost:5001/api/generate-timetable", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        navigate("/admin/timetable", { 
          state: { timetableData: response.data.timetable } 
        });
      } else {
        alert("Generation failed: " + response.data.message);
      }
    } catch (err) {
      alert("Failed to connect to AI Server (Port 5001).");
    } finally {
      setGenerating(false);
    }
  };

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/admin" },
    { name: "Staff Management", icon: Users2, href: "/admin/staff-management" },
    { name: "TimeTable View", icon: CalendarCheck, href: "/admin/timetable" },
    { name: "Settings", icon: Settings, href: "/admin/settings" },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Sidebar & Navigation */}
      <Sidebar navItems={navItems} admin={admin} handleLogout={handleLogout} />
      <MobileSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} navItems={navItems} handleLogout={handleLogout} />

      {/* Main Content Wrapper */}
      <div className="lg:pl-72 min-h-screen flex flex-col transition-all duration-300">
        
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-30 shadow-sm px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-lg">
            <div className="p-1.5 bg-indigo-600 rounded-lg text-white"><GraduationCap size={20} /></div>
            <span>Scheduler</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 space-y-8 pb-32">
          
          {/* 1. Dashboard Header & Stats */}
          <div className="space-y-6">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Dashboard</h1>
                  <p className="text-slate-500 text-sm md:text-base mt-1">Manage academic allocations and schedule generation.</p>
                </div>
                <div className="hidden md:block">
                   <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {admin?.name?.charAt(0) || "A"}
                      </div>
                      <div className="text-sm">
                        <p className="font-semibold text-slate-900">{admin?.name}</p>
                        <p className="text-xs text-slate-500">Administrator</p>
                      </div>
                   </div>
                </div>
             </div>

             <StatsOverview 
                totalStaff={allStaff.length} 
                totalCourses={allCourses.length} 
                allocations={staffAllocations.length} 
             />
          </div>

          {/* 2. Allocation Form */}
          <AddAllocationForm 
            form={form}
            handleChange={handleChange}
            handleAddStaff={handleAddStaff}
            loading={loading}
            error={error}
            allStaff={allStaff}
            filteredCourses={filteredCourses}
            isStaffSelected={!!form.staffId}
          />

          {/* 3. Allocations List */}
          <AllocationsList 
            staffAllocations={staffAllocations} 
            handleDeleteAllocation={handleDeleteAllocation} 
          />

        </main>
      </div>

      {/* Floating Generate Button (Contextual) */}
      <FloatingGenerateButton 
        handleGenerate={handleGenerateTimetable} 
        generating={generating} 
        count={staffAllocations.length}
      />

    </div>
  );
}

// --- SUB-COMPONENTS ---

const StatsOverview = ({ totalStaff, totalCourses, allocations }) => {
  const stats = [
    { label: "Active Staff", value: totalStaff, icon: Users2, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Courses", value: totalCourses, icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Allocations", value: allocations, icon: Clock, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
            <stat.icon size={20} className="md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-xs md:text-sm font-medium text-slate-500 uppercase tracking-wide">{stat.label}</p>
            <p className="text-xl md:text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const AddAllocationForm = ({ form, handleChange, handleAddStaff, loading, error, allStaff, filteredCourses, isStaffSelected }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Plus size={18} className="text-indigo-600" />
          New Allocation
        </h3>
      </div>
      
      <div className="p-6">
        <form onSubmit={handleAddStaff} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-end">
          
          {/* Faculty */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Faculty</label>
            <div className="relative">
              <select
                name="staffId"
                value={form.staffId}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 appearance-none"
              >
                <option value="">Select Faculty</option>
                {allStaff.map(opt => <option key={opt._id} value={opt._id}>{opt.name}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500"><ChevronRight size={14} className="rotate-90" /></div>
            </div>
          </div>

          {/* Course */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Course</label>
            <div className="relative">
              <select
                name="courseId"
                value={form.courseId}
                onChange={handleChange}
                disabled={!isStaffSelected}
                className={`w-full border text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 appearance-none ${!isStaffSelected ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
              >
                <option value="">{isStaffSelected ? "Select Course" : "Choose Faculty First"}</option>
                {filteredCourses.map(opt => (
                  <option key={opt._id} value={opt._id}>{opt.name} ({opt.code})</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500"><ChevronRight size={14} className="rotate-90" /></div>
            </div>
          </div>

          {/* Year */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Year</label>
            <select name="year" value={form.year} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 p-2.5">
              <option value="">-</option>
              {["I", "II", "III", "IV"].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Section & Periods */}
          <div className="lg:col-span-1">
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sec</label>
             <input type="text" name="section" value={form.section} onChange={handleChange} placeholder="A" className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 p-2.5" />
          </div>
          <div className="lg:col-span-1">
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Hrs</label>
             <input type="number" name="periods" value={form.periods} onChange={handleChange} placeholder="5" className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 p-2.5" />
          </div>

          {/* Submit */}
          <div className="lg:col-span-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-bold rounded-lg text-sm px-5 py-2.5 focus:outline-none transition-all disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              Assign
            </button>
          </div>

        </form>
        {error && (
          <div className="mt-4 p-3 text-sm text-red-700 bg-red-50 rounded-lg flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}
      </div>
    </div>
  </motion.div>
);

const AllocationsList = ({ staffAllocations, handleDeleteAllocation }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
    <h3 className="text-lg font-bold text-slate-800 mb-4 px-1">Current Allocations</h3>
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      
      {/* Desktop Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-500">
          <thead className="text-xs text-slate-700 uppercase bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-bold">Faculty</th>
              <th className="px-6 py-4 font-bold">Course</th>
              <th className="px-6 py-4 font-bold text-center">Year / Sec</th>
              <th className="px-6 py-4 font-bold text-center">Hours</th>
              <th className="px-6 py-4 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {staffAllocations.length > 0 ? (
              staffAllocations.map((item) => (
                <tr key={item._id} className="bg-white hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                    {item.staffId?.name || "Unknown"}
                  </td>
                  <td className="px-6 py-4 text-slate-800">
                    <div className="flex flex-col">
                      <span>{item.courseId?.name || "Unknown"}</span>
                      <span className="text-xs text-slate-400">{item.courseId?.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-1 rounded">
                      {item.year} - {item.section}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-700">{item.periods}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeleteAllocation(item._id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Remove Allocation"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center">
                   <div className="flex flex-col items-center justify-center text-slate-400">
                      <BookOpen size={40} className="mb-3 opacity-20" />
                      <p>No allocations yet. Add one above.</p>
                   </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </motion.div>
);

const Sidebar = ({ navItems, admin, handleLogout }) => (
  <aside className="hidden lg:flex flex-col w-72 fixed inset-y-0 bg-white border-r border-gray-200 z-40">
    <div className="h-16 flex items-center px-8 border-b border-gray-100">
       <Link to="/admin" className="flex items-center gap-2 font-bold text-xl text-slate-800">
          <div className="p-1.5 bg-indigo-600 rounded-lg text-white"><GraduationCap size={24} /></div>
          <span>Scheduler</span>
       </Link>
    </div>
    <div className="flex-1 px-4 py-6 space-y-1">
       {navItems.map((item) => (
         <Link key={item.name} to={item.href} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors group">
            <item.icon size={20} className="group-hover:scale-110 transition-transform" />
            {item.name}
         </Link>
       ))}
    </div>
    <div className="p-4 border-t border-gray-100">
       <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-colors">
          <LogOut size={20} /> Logout
       </button>
    </div>
  </aside>
);

const MobileSidebar = ({ isOpen, setIsOpen, navItems, handleLogout }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div 
           initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
           className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
           onClick={() => setIsOpen(false)}
        />
        <motion.div 
           initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
           className="fixed inset-y-0 left-0 w-64 bg-white shadow-2xl z-50 lg:hidden flex flex-col"
        >
           <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
              <span className="font-bold text-lg text-slate-800">Menu</span>
              <button onClick={() => setIsOpen(false)}><X size={24} className="text-slate-500" /></button>
           </div>
           <nav className="flex-1 px-4 py-6 space-y-2">
              {navItems.map(item => (
                <Link key={item.name} to={item.href} onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 text-slate-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-600">
                   <item.icon size={20} /> {item.name}
                </Link>
              ))}
           </nav>
           <div className="p-4 border-t border-gray-100">
             <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg"><LogOut size={20} /> Logout</button>
           </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const FloatingGenerateButton = ({ handleGenerate, generating, count }) => {
  if (count === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-30">
       <motion.button
         whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
         onClick={handleGenerate}
         disabled={generating}
         className="flex items-center gap-3 bg-indigo-600 text-white px-6 py-4 rounded-full shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
       >
         {generating ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} className="fill-indigo-300" />}
         <span className="font-bold tracking-wide">{generating ? "Processing..." : "Generate Timetable"}</span>
       </motion.button>
    </div>
  );
};