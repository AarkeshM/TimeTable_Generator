// --- AdminDashboard.jsx ---
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Menu,
  LayoutDashboard,
  Users2,
  BookCopy,
  Settings,
  LogOut,
  GraduationCap,
  X,
  PlusCircle,
  User,
  Loader2,
} from "lucide-react";

// --- Main Component ---
export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [staffAllocations, setStaffAllocations] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [form, setForm] = useState({ staffId: "", courseId: "", year: "", section: "", periods: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Load admin and initial data
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

  // Fetch allocations, courses, and staff
  const fetchInitialData = async (token) => {
    try {
      const [allocRes, coursesRes, staffRes] = await Promise.all([
        axios.get("http://localhost:5000/api/staff-allocations", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("http://localhost:5000/api/courses", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("http://localhost:5000/api/staff", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setStaffAllocations(allocRes.data.allocations || []);
      setAllCourses(coursesRes.data.courses || []);
      setAllStaff(staffRes.data.staff || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Failed to fetch initial dashboard data.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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
      const { data } = await axios.post("http://localhost:5000/api/staff-allocations/add", form, {
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

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/admin" },
    { name: "Staff Management", icon: Users2, href: "#" },
    { name: "Course Management", icon: BookCopy, href: "#" },
    { name: "Settings", icon: Settings, href: "#" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Sidebar navItems={navItems} admin={admin} handleLogout={handleLogout} />
      <MobileSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} navItems={navItems} handleLogout={handleLogout} />
      <div className="lg:pl-64">
        <header className="lg:hidden sticky top-0 bg-white/70 backdrop-blur-sm border-b border-slate-200 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
            <Link to="/admin" className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <GraduationCap className="w-6 h-6 text-blue-600" />
              AcademiaSched
            </Link>
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md text-slate-600 hover:bg-slate-100">
              <Menu size={24} />
            </button>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8 space-y-8">
          <WelcomeHeader adminName={admin?.name} />
          <AddStaffForm
            form={form}
            handleChange={handleChange}
            handleAddStaff={handleAddStaff}
            loading={loading}
            error={error}
            allStaff={allStaff}
            allCourses={allCourses}
          />
          <StaffTable staffs={staffAllocations} />
        </main>
      </div>
    </div>
  );
}

// --- Sidebar Components ---
const Sidebar = ({ navItems, admin, handleLogout }) => (
  <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 bg-white border-r border-slate-200 z-40">
    <div className="px-6 h-20 flex items-center gap-3 border-b border-slate-200">
      <GraduationCap className="w-8 h-8 text-blue-600" />
      <h1 className="text-xl font-bold text-slate-800">AcademiaSched</h1>
    </div>
    <nav className="flex-1 px-4 py-6 space-y-2">
      {navItems.map((item) => (
        <a key={item.name} href={item.href} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors">
          <item.icon size={20} />
          <span>{item.name}</span>
        </a>
      ))}
    </nav>
    <div className="px-4 py-4 border-t border-slate-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <User className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <p className="font-semibold text-sm">{admin?.name || "Admin User"}</p>
          <p className="text-xs text-slate-500">{admin?.email}</p>
        </div>
        <button onClick={handleLogout} className="ml-auto p-2 rounded-md text-slate-500 hover:bg-slate-100">
          <LogOut size={18} />
        </button>
      </div>
    </div>
  </aside>
);

const MobileSidebar = ({ isOpen, setIsOpen, navItems, handleLogout }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
          transition={{ duration: 0.3 }} 
          className="fixed inset-0 bg-black/40 z-40" 
          onClick={() => setIsOpen(false)} 
        />
        <motion.div 
          initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} 
          transition={{ type: "spring", stiffness: 300, damping: 30 }} 
          className="fixed top-0 left-0 bottom-0 w-64 bg-white z-50 flex flex-col"
        >
          <div className="px-6 h-20 flex items-center justify-between border-b border-slate-200">
            <Link to="/admin" className="flex items-center gap-3 text-lg font-bold text-slate-800">
              <GraduationCap className="w-7 h-7 text-blue-600" />
              AcademiaSched
            </Link>
            <button onClick={() => setIsOpen(false)} className="p-2 -mr-2 rounded-md text-slate-600 hover:bg-slate-100">
              <X size={20} />
            </button>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <a key={item.name} href={item.href} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors">
                <item.icon size={20} />
                <span>{item.name}</span>
              </a>
            ))}
          </nav>
          <div className="px-4 py-4 border-t border-slate-200">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-600 font-medium hover:bg-red-50 transition-colors">
              <LogOut size={20}/>
              <span>Logout</span>
            </button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// --- Dashboard Header ---
const WelcomeHeader = () => (
  <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
    <h2 className="text-2xl font-bold text-slate-900">Admin Dashboard</h2>
    <p className="text-slate-500 mt-1">Manage staff, courses, and generate timetables.</p>
  </motion.div>
);

// --- Add Staff Form ---
const AddStaffForm = ({ form, handleChange, handleAddStaff, loading, error, allStaff, allCourses }) => (
  <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <PlusCircle size={20} className="text-blue-600" />
        Assign Course to Staff
      </h3>
      <form onSubmit={handleAddStaff} className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7 items-end">
        <div className="lg:col-span-2">
          <ObjectSelectField 
            label="Staff Name" 
            name="staffId" 
            value={form.staffId} 
            onChange={handleChange} 
            options={allStaff} 
            valueKey="_id" 
            labelKey="name" 
            placeholder="Select Staff" 
          />
        </div>
        <ObjectSelectField 
          label="Course Acronym" 
          name="courseId" 
          value={form.courseId} 
          onChange={handleChange} 
          options={allCourses} 
          valueKey="_id" 
          labelKey="acronym" 
          placeholder="Select Course" 
        />
        <SelectField label="Year" name="year" value={form.year} onChange={handleChange} options={["I","II","III","IV"]} placeholder="Select Year" />
        <InputField label="Section" name="section" value={form.section} onChange={handleChange} placeholder="e.g., A" />
        <InputField label="Periods" name="periods" type="number" value={form.periods} onChange={handleChange} placeholder="e.g., 7" />
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-semibold rounded-lg py-2.5 px-4 hover:bg-blue-700 transition h-10 flex items-center justify-center disabled:bg-blue-400">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Add"}
        </button>
      </form>
      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
    </div>
  </motion.div>
);

// --- Staff Table ---
const StaffTable = ({ staffs }) => (
  <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
    <h3 className="text-lg font-semibold text-slate-800 mb-4">Staff Course Allocations</h3>
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 font-semibold text-slate-700 text-left">Staff Name</th>
            <th className="px-6 py-3 font-semibold text-slate-700 text-left">Course Acronym</th>
            <th className="px-6 py-3 font-semibold text-slate-700 text-left">Year</th>
            <th className="px-6 py-3 font-semibold text-slate-700 text-left">Section</th>
            <th className="px-6 py-3 font-semibold text-slate-700 text-left">Periods</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {staffs.length > 0 ? (
            staffs.map((s) => (
              <tr key={s._id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap">{s.staffId?.name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{s.courseId?.acronym || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">{s.year}</td>
                <td className="px-6 py-4 whitespace-nowrap">{s.section}</td>
                <td className="px-6 py-4 whitespace-nowrap">{s.periods}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="p-6 text-center text-slate-500">
                No staff course allocations have been made yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </motion.div>
);

// --- Form Field Components ---
const InputField = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
    <input {...props} className="w-full border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm text-sm h-10" />
  </div>
);

const SelectField = ({ label, name, value, onChange, options, placeholder }) => (
  <div>
    <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
    <select name={name} value={value} onChange={onChange} className="w-full border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm text-sm h-10 bg-white">
      <option value="">{placeholder}</option>
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const ObjectSelectField = ({ label, name, value, onChange, options, valueKey, labelKey, placeholder }) => (
  <div>
    <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
    <select name={name} value={value} onChange={onChange} className="w-full border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm text-sm h-10 bg-white">
      <option value="">{placeholder}</option>
      {options.map(opt => <option key={opt[valueKey]} value={opt[valueKey]}>{opt[labelKey]}</option>)}
    </select>
  </div>
);
