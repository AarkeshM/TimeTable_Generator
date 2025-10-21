import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Menu,
  Home,
  Calendar,
  User,
  BookCopy,
  GraduationCap,
  X,
  PlusCircle,
  Loader2,
  LogOut,
} from "lucide-react";

export default function StaffDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [staff, setStaff] = useState(null);
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    name: "",
    code: "",
    acronym: "",
    year: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (userData && token) {
      setStaff(JSON.parse(userData));
      fetchCourses(token);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // ✅ FIXED: Added await and proper response parsing
  const fetchCourses = async (token) => {
    try {
      const res = await axios.get("http://localhost:5000/api/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(res.data.courses || []);
    } catch (err) {
      console.error("Fetch courses error:", err);
      setError("Failed to fetch courses.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // ✅ FIXED: Clear form and refresh courses after success
  const handleAddCourse = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.code || !form.acronym || !form.year) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/courses/add",
        form,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.course) {
        setCourses((prev) => [res.data.course, ...prev]);
        setForm({ name: "", code: "", acronym: "", year: "" });
      } else {
        setError("Unexpected response from server.");
      }
    } catch (err) {
      console.error("Add course error:", err);
      setError(err.response?.data?.message || "Failed to add course.");
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { name: "Dashboard", icon: Home, href: "/staff" },
    { name: "My Timetable", icon: Calendar, href: "#" },
    { name: "Courses", icon: BookCopy, href: "#" },
    { name: "Profile", icon: User, href: "#" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <Sidebar
        navItems={navItems}
        staff={staff}
        handleLogout={handleLogout}
      />
      <MobileSidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        navItems={navItems}
        staff={staff}
        handleLogout={handleLogout}
      />

      <div className="lg:pl-64">
        <header className="lg:hidden sticky top-0 bg-white/70 backdrop-blur-sm border-b border-slate-200 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
            <Link
              to="/staff"
              className="flex items-center gap-2 text-lg font-bold text-slate-800"
            >
              <GraduationCap className="w-6 h-6 text-blue-600" />
              AcademiaSched
            </Link>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-slate-600 hover:bg-slate-100"
            >
              <Menu size={24} />
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 space-y-8">
          <WelcomeHeader staffName={staff?.name} />

          <AddCourseForm
            form={form}
            handleChange={handleChange}
            handleAddCourse={handleAddCourse}
            loading={loading}
            error={error}
          />

          <CoursesTable courses={courses} />
        </main>
      </div>
    </div>
  );
}

const Sidebar = ({ navItems, staff, handleLogout }) => (
  <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 bg-white border-r border-slate-200 z-40">
    <div className="px-6 h-20 flex items-center gap-3 border-b border-slate-200">
      <GraduationCap className="w-8 h-8 text-blue-600" />
      <h1 className="text-xl font-bold text-slate-800">AcademiaSched</h1>
    </div>
    <nav className="flex-1 px-4 py-6 space-y-2">
      {navItems.map((item) => (
        <a
          key={item.name}
          href={item.href}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors"
        >
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
          <p className="font-semibold text-sm">{staff?.name || "Staff User"}</p>
          <p className="text-xs text-slate-500">{staff?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="ml-auto p-2 rounded-md text-slate-500 hover:bg-slate-100"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  </aside>
);

const MobileSidebar = ({ isOpen, setIsOpen, navItems, staff, handleLogout }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 bottom-0 w-64 bg-white z-50 flex flex-col"
        >
          <div className="px-6 h-20 flex items-center justify-between border-b border-slate-200">
            <Link
              to="/staff"
              className="flex items-center gap-3 text-lg font-bold text-slate-800"
            >
              <GraduationCap className="w-7 h-7 text-blue-600" />
              AcademiaSched
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 -mr-2 rounded-md text-slate-600 hover:bg-slate-100"
            >
              <X size={20} />
            </button>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </a>
            ))}
          </nav>
          <div className="px-4 py-4 border-t border-slate-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-600 font-medium hover:bg-red-50 transition-colors"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const WelcomeHeader = ({ staffName }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1 }}
  >
    <h2 className="text-2xl font-bold text-slate-900">
      Welcome, <span className="text-blue-600">{staffName || "Staff"}!</span>
    </h2>
    <p className="text-slate-500 mt-1">
      Manage your courses and view your schedule here.
    </p>
  </motion.div>
);

const AddCourseForm = ({
  form,
  handleChange,
  handleAddCourse,
  loading,
  error,
}) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 }}
  >
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <PlusCircle size={20} className="text-blue-600" />
        Add New Course
      </h3>
      <form
        onSubmit={handleAddCourse}
        className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-5 items-end"
      >
        <InputField
          label="Course Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="e.g., Data Structures"
        />
        <InputField
          label="Code"
          name="code"
          value={form.code}
          onChange={handleChange}
          placeholder="e.g., CS201"
        />
        <InputField
          label="Acronym"
          name="acronym"
          value={form.acronym}
          onChange={handleChange}
          placeholder="e.g., DS"
        />
        <SelectField
          label="Year"
          name="year"
          value={form.year}
          onChange={handleChange}
          options={["I", "II", "III", "IV"]}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-semibold rounded-lg py-2.5 px-4 hover:bg-blue-700 transition h-10 flex items-center justify-center disabled:bg-blue-400"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Add"}
        </button>
      </form>
      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
    </div>
  </motion.div>
);

const CoursesTable = ({ courses }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
  >
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 font-semibold text-slate-700 text-left">
              Name
            </th>
            <th className="px-6 py-3 font-semibold text-slate-700 text-left">
              Code
            </th>
            <th className="px-6 py-3 font-semibold text-slate-700 text-left">
              Acronym
            </th>
            <th className="px-6 py-3 font-semibold text-slate-700 text-left">
              Year
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {courses.length > 0 ? (
            courses.map((c) => (
              <tr key={c._id || c.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap">{c.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{c.code}</td>
                <td className="px-6 py-4 whitespace-nowrap">{c.acronym}</td>
                <td className="px-6 py-4 whitespace-nowrap">{c.year}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="p-6 text-center text-slate-500">
                No courses have been added yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </motion.div>
);

const InputField = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-600 mb-1">
      {label}
    </label>
    <input
      {...props}
      className="w-full border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm text-sm h-10"
    />
  </div>
);

const SelectField = ({ label, name, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-slate-600 mb-1">
      {label}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm text-sm h-10 bg-white"
    >
      <option value="">Select Year</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);
