import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Menu, Home, Calendar, User, BookCopy, GraduationCap,
  X, PlusCircle, Loader2, LogOut, Code, Hash, TrendingUp, AlertTriangle
} from "lucide-react";

// --- Configuration ---
const API_BASE_URL = "http://localhost:5000/api";
const YEAR_OPTIONS = ["I", "II", "III", "IV"];

// ----------------------- MAIN COMPONENT ----------------------- //
export default function StaffDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [staff, setStaff] = useState(null);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ name: "", code: "", acronym: "", year: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!userData || !token) {
      console.log("No user data or token found, navigating to login.");
      return navigate("/login");
    }

    setStaff(JSON.parse(userData));
    fetchCourses(token);
  }, [navigate]);

  const fetchCourses = async (token) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(res.data.courses);
    } catch (err) {
      console.error("Fetch courses error:", err);
      setError("Failed to fetch courses.");
    }
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddCourse = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.code || !form.acronym || !form.year)
      return setError("All fields are required.");

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/courses/add`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCourses((prev) => [res.data.course, ...prev]);
      setForm({ name: "", code: "", acronym: "", year: "" });
    } catch (err) {
      console.error("Add course error:", err.response?.data?.message || err.message);
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Desktop Sidebar (Fixed) */}
      <Sidebar navItems={navItems} staff={staff} handleLogout={handleLogout} />
      
      {/* Mobile Sidebar (Overlay) */}
      <MobileSidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        navItems={navItems}
        staff={staff}
        handleLogout={handleLogout}
      />

      {/* Main Content Area Wrapper */}
      <div className="flex-1 lg:pl-64">
        
        {/* Top Bar for Mobile/Tablet */}
        <header className="lg:hidden sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm py-4 px-6 flex justify-between items-center z-30">
          <Link to="/staff" className="flex gap-2 font-extrabold text-xl text-blue-700">
            <GraduationCap className="w-7 h-7" />
            Acad Scheduler
          </Link>
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-full hover:bg-slate-100 transition">
            <Menu size={26} />
          </button>
        </header>

        {/* Main Content Area */}
        <main className="p-4 sm:p-6 lg:p-10 space-y-10 max-w-7xl mx-auto">
          <WelcomeHeader staffName={staff?.name} />

          <AddCourseForm
            form={form}
            handleChange={handleChange}
            handleAddCourse={handleAddCourse}
            loading={loading}
            error={error}
          />

          <CoursesSection courses={courses} />
        </main>
      </div>
    </div>
  );
}

// ----------------------- SIDEBAR ----------------------- //

const Sidebar = ({ navItems, staff, handleLogout }) => {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 bg-white border-r border-slate-200 shadow-xl z-20">
      {/* Logo & Title */}
      <div className="px-6 h-20 flex items-center gap-3 border-b border-slate-100 bg-blue-600/5">
        <GraduationCap className="text-blue-700 w-8 h-8" />
        <h1 className="text-xl font-extrabold text-slate-800">AcademicScheduler</h1>
      </div>

      {/* Navigation Links */}
      <nav className="px-4 py-6 space-y-2 flex-grow">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition duration-200 ease-in-out font-medium ${
              location.pathname === item.href
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            <item.icon size={20} />
            {item.name}
          </Link>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="text-blue-600 w-5 h-5" />
          </div>

          <div className="overflow-hidden">
            <p className="font-semibold text-sm truncate">{staff?.name || "Staff Member"}</p>
            <p className="text-xs text-slate-500 truncate">{staff?.email || "Email"}</p>
          </div>

          <button
            onClick={handleLogout}
            className="ml-auto p-2 rounded-full text-slate-500 hover:bg-red-100 hover:text-red-600 transition flex-shrink-0"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
};

// ----------------------- MOBILE SIDEBAR ----------------------- //

const MobileSidebar = ({ isOpen, setIsOpen, navItems, staff, handleLogout }) => {
  const location = useLocation();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden" // Hide on lg screens
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed top-0 left-0 bottom-0 w-64 bg-white z-50 flex flex-col lg:hidden" // Hide on lg screens
          >
            <div className="flex items-center justify-between p-6 border-b">
              <Link to="/staff" className="flex gap-2 font-extrabold text-xl text-blue-700">
                <GraduationCap className="w-7 h-7" />
                Acad Scheduler
              </Link>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-slate-100 transition">
                <X size={22} />
              </button>
            </div>

            <nav className="p-4 space-y-2 flex-grow">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${
                    location.pathname === item.href
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-600 hover:bg-blue-50"
                  }`}
                >
                  <item.icon size={20} />
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="p-4 border-t">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition font-semibold"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ----------------------- CONTENT COMPONENTS ----------------------- //

const WelcomeHeader = ({ staffName }) => (
  <motion.div 
    initial={{ opacity: 0, y: -20 }} 
    animate={{ opacity: 1, y: 0 }} 
    className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200"
  >
    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800">
      Hello, <span className="text-blue-600">{staffName || "Staff Member"}!</span> 👋
    </h2>
    <p className="text-slate-500 mt-1 text-base sm:text-lg">
      Welcome back to your course and scheduling management dashboard.
    </p>
  </motion.div>
);

const AddCourseForm = ({ form, handleChange, handleAddCourse, loading, error }) => (
  <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-slate-200">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-slate-700">
        <PlusCircle className="text-blue-600 w-6 h-6" /> Register New Course
      </h3>

      <form
        onSubmit={handleAddCourse}
        // Responsive Grid Layout
        className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"
      >
        <div className="md:col-span-2 lg:col-span-2"> {/* Full width on mobile, 2/4 on md, 2/5 on lg */}
            <InputField 
              label="Course Name" 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              icon={BookCopy}
              placeholder="e.g., Data Structures and Algorithms"
            />
        </div>
        
        <InputField 
            label="Code" 
            name="code" 
            value={form.code} 
            onChange={handleChange} 
            icon={Code}
            placeholder="e.g., CS101"
        />
        
        <InputField 
            label="Acronym" 
            name="acronym" 
            value={form.acronym} 
            onChange={handleChange} 
            icon={Hash}
            placeholder="e.g., DSA"
        />

        {/* This block handles the Select and Button positioning */}
        <div className="grid grid-cols-2 gap-4 md:col-span-4 lg:col-span-1 md:grid-cols-none md:gap-0 lg:flex lg:flex-col">
            <SelectField
              label="Year Level"
              name="year"
              value={form.year}
              onChange={handleChange}
              options={YEAR_OPTIONS}
              icon={GraduationCap}
              className="col-span-1"
            />
            {/* The button occupies the remaining space, making it full width on mobile/tablet rows */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className={`col-span-1 h-full py-3 mt-auto flex items-center justify-center rounded-lg font-semibold transition ${
                loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
              } lg:mt-6`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <>
                  <PlusCircle className="w-5 h-5 mr-2" /> Add Course
                </>
              )}
            </motion.button>
        </div>
      </form>

      {error && (
        <p className="text-red-600 mt-4 p-3 bg-red-50 rounded-lg border border-red-200 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2" /> {error}
        </p>
      )}
    </div>
  </motion.div>
);

// ----------------------- UPDATED COURSES SECTION ----------------------- //

const CoursesSection = ({ courses }) => (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h3 className="text-2xl font-bold mb-4 flex items-center gap-3 text-slate-800">
            <BookCopy className="text-blue-600 w-6 h-6" /> My Registered Courses
        </h3>
        
        {/* Course List Wrapper */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            
            {/* Empty State */}
            {courses?.length === 0 && (
                <div className="text-center p-8 text-lg text-slate-500">
                    <div className="flex flex-col items-center">
                        <BookCopy className="w-10 h-10 text-slate-300 mb-2" />
                        No courses currently registered. Use the form above to add one!
                    </div>
                </div>
            )}

            {/* Desktop/Tablet View (md and up) */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-base border-collapse">
                    <thead className="bg-blue-600 text-white sticky top-0">
                        <tr>
                            <th className="px-6 py-4 text-left font-medium">Name</th>
                            <th className="px-6 py-4 text-left font-medium">Code</th>
                            <th className="px-6 py-4 text-left font-medium">Acronym</th>
                            <th className="px-6 py-4 text-left font-medium">Year</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courses?.map((c, index) => (
                            <tr 
                                key={c._id} 
                                className={`transition duration-150 ease-in-out ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50`}
                            >
                                <td className="px-6 py-4 font-semibold text-slate-800">{c.name}</td>
                                <td className="px-6 py-4 text-slate-600">{c.code}</td>
                                <td className="px-6 py-4 text-slate-600">{c.acronym}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-indigo-100 text-indigo-800">
                                        <TrendingUp className="w-4 h-4 mr-1" />
                                        {c.year}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile View (sm and below) */}
            <div className="md:hidden p-4 space-y-4">
                {courses?.map((c) => (
                    <motion.div
                        key={c._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-lg font-bold text-slate-800">{c.name}</h4>
                            <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Year {c.year}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                            <div className="flex items-center">
                                <Code className="w-4 h-4 mr-2 text-blue-500" />
                                <strong>Code:</strong> {c.code}
                            </div>
                            <div className="flex items-center">
                                <Hash className="w-4 h-4 mr-2 text-blue-500" />
                                <strong>Acronym:</strong> {c.acronym}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

        </div>
    </motion.div>
);

// --- Reusable Form Fields ---

const InputField = ({ label, icon: Icon, ...props }) => (
  <div className="flex flex-col">
    <label className="text-sm font-medium text-slate-700 flex items-center mb-1">
      {Icon && <Icon className="w-4 h-4 mr-2 text-blue-500" />}
      {label}
    </label>
    <input 
      {...props} 
      className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm placeholder:text-slate-400"
    />
  </div>
);

const SelectField = ({ label, name, value, onChange, options, icon: Icon, className }) => (
  <div className={`flex flex-col ${className}`}>
    <label className="text-sm font-medium text-slate-700 flex items-center mb-1">
      {Icon && <Icon className="w-4 h-4 mr-2 text-blue-500" />}
      {label}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full p-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm appearance-none cursor-pointer"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%236B7280'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd' /%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.75rem center',
        backgroundSize: '1.5em 1.5em'
      }}
    >
      <option value="" disabled>Select {label}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);