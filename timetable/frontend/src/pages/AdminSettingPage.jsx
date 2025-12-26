import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Settings, User, Lock, ArrowLeft, Loader2, Save,
  LayoutDashboard, Users2, CalendarCheck, LogOut, GraduationCap, X, Menu
} from "lucide-react";

// --- Configuration ---
const API_BASE_URL = "http://localhost:5000/api/staff";
const DEPARTMENT_OPTIONS = ["Computer Science", "Physics", "Chemistry", "EEE", "ECE", "Mechanical", "Civil"];

export default function AdminSettings() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(null);

  // Forms
  const [profileForm, setProfileForm] = useState({ name: "", email: "", mobile: "", department: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmNewPassword: "" });

  // UI State
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: "", text: "" });
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });

  // --- 1. Initialization ---
  useEffect(() => {
    const userData = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role === "admin") {
        setAdmin(parsedUser);
        // Load initial state from local storage
        setProfileForm({
          name: parsedUser.name || "",
          email: parsedUser.email || "",
          mobile: parsedUser.mobile || "",
          department: parsedUser.department || "",
        });
        // Fetch fresh data from DB to ensure sync
        fetchLatestData(parsedUser._id, token);
      } else {
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // --- 2. Fetch Latest Admin Data ---
  const fetchLatestData = async (id, token) => {
    try {
      // Assuming you have a route like GET /api/staff/:id or you can use the profile endpoint
      // Using the user object if available, or just keeping the local storage state if API fails
      // For now, we will rely on local storage, but this function is where you'd do a GET request.
    } catch (err) {
      console.error("Failed to refresh profile data", err);
    }
  };

  // --- 3. Handlers ---
  const handleProfileChange = (e) => setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // --- 4. Update Profile Submit ---
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage({ type: "", text: "" });

    const token = localStorage.getItem("token");
    
    try {
      const { data } = await axios.put(`${API_BASE_URL}/update/${admin._id}`, {
        name: profileForm.name,
        mobile: profileForm.mobile,
        department: profileForm.department,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update Local Storage
      const updatedUser = { ...admin, ...data.updatedStaff };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setAdmin(updatedUser);

      setProfileMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      console.error(err);
      setProfileMessage({ type: "error", text: err.response?.data?.message || "Failed to update profile." });
    } finally {
      setProfileLoading(false);
      setTimeout(() => setProfileMessage({ type: "", text: "" }), 3000);
    }
  };

  // --- 5. Change Password Submit ---
  const handleChangePassword = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmNewPassword } = passwordForm;

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage({ type: "", text: "" });
    const token = localStorage.getItem("token");

    try {
      await axios.put(`${API_BASE_URL}/change-password/${admin._id}`, {
        currentPassword,
        newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPasswordMessage({ type: "success", text: "Password changed successfully!" });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (err) {
      console.error(err);
      setPasswordMessage({ type: "error", text: err.response?.data?.message || "Failed to change password." });
    } finally {
      setPasswordLoading(false);
      setTimeout(() => setPasswordMessage({ type: "", text: "" }), 3000);
    }
  };

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/admin" },
    { name: "Staff Management", icon: Users2, href: "/admin/staff-management" },
    { name: "TimeTable", icon: CalendarCheck, href: "/admin/timetable" },
    { name: "Settings", icon: Settings, href: "/admin/settings" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800">
      <Sidebar navItems={navItems} admin={admin} handleLogout={handleLogout} />
      <MobileSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} navItems={navItems} handleLogout={handleLogout} />

      <div className="lg:pl-72">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-100 z-30 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
            <Link to="/admin" className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
              AcademicShedular
            </Link>
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-slate-600 hover:bg-gray-100 transition-colors">
              <Menu size={24} />
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-10 space-y-10">
          <PageHeader 
            title="Admin Settings" 
            subtitle="Manage your profile information and security settings." 
            backLink="/admin"
          />

          {/* --- Profile Section --- */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="bg-white p-8 rounded-2xl shadow-lg ring-1 ring-gray-100">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3 border-b pb-3">
                <User size={24} className="text-indigo-600" />
                Update Profile
              </h3>
              <form onSubmit={handleProfileUpdate} className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-end">
                <InputField label="Full Name" name="name" value={profileForm.name} onChange={handleProfileChange} />
                <InputField label="Email" name="email" value={profileForm.email} disabled={true} />
                <InputField label="Mobile" name="mobile" value={profileForm.mobile} onChange={handleProfileChange} />
                <SelectField label="Department" name="department" value={profileForm.department} onChange={handleProfileChange} options={DEPARTMENT_OPTIONS} placeholder="Select Department" />
                
                <div className="md:col-span-2 lg:col-span-4 flex justify-end">
                  <button type="submit" disabled={profileLoading} className="w-full md:w-auto bg-indigo-600 text-white font-bold rounded-xl py-3 px-6 hover:bg-indigo-700 transition h-11 flex items-center justify-center disabled:bg-indigo-400">
                    {profileLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save size={20} className="mr-2"/>}
                    {profileLoading ? "Updating..." : "Save Changes"}
                  </button>
                </div>
              </form>
              <MessageDisplay message={profileMessage} />
            </div>
          </motion.div>

          {/* --- Password Section --- */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="bg-white p-8 rounded-2xl shadow-lg ring-1 ring-gray-100">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3 border-b pb-3">
                <Lock size={24} className="text-red-500" />
                Change Password
              </h3>
              <form onSubmit={handleChangePassword} className="grid gap-6 grid-cols-1 md:grid-cols-3 items-end">
                <InputField label="Current Password" name="currentPassword" type="password" value={passwordForm.currentPassword} onChange={handlePasswordChange} placeholder="Current Password" required />
                <InputField label="New Password" name="newPassword" type="password" value={passwordForm.newPassword} onChange={handlePasswordChange} placeholder="New Password" required />
                <InputField label="Confirm Password" name="confirmNewPassword" type="password" value={passwordForm.confirmNewPassword} onChange={handlePasswordChange} placeholder="Confirm New Password" required />
                
                <div className="md:col-span-3 flex justify-end">
                  <button type="submit" disabled={passwordLoading} className="w-full md:w-auto bg-red-600 text-white font-bold rounded-xl py-3 px-6 hover:bg-red-700 transition h-11 flex items-center justify-center disabled:bg-red-400">
                    {passwordLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Lock size={20} className="mr-2"/>}
                    {passwordLoading ? "Updating..." : "Change Password"}
                  </button>
                </div>
              </form>
              <MessageDisplay message={passwordMessage} />
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}

// --- Reusable Sub-Components ---

const PageHeader = ({ title, subtitle, backLink }) => (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {backLink && (
            <Link to={backLink} className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition mb-4 p-2 -ml-2 rounded-lg hover:bg-indigo-50">
                <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
            </Link>
        )}
        <h2 className="text-3xl font-extrabold text-gray-900">{title}</h2>
        <p className="text-gray-500 mt-2 text-lg">{subtitle}</p>
        <div className="h-0.5 w-16 bg-indigo-500 mt-2 rounded-full"></div>
    </motion.div>
);

const InputField = ({ label, disabled = false, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <input {...props} disabled={disabled} className={`w-full border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-inner text-base h-11 ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} />
  </div>
);

const SelectField = ({ label, name, value, onChange, options, placeholder, disabled=false }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <select name={name} value={value} onChange={onChange} disabled={disabled} className={`w-full border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-inner text-base h-11 bg-white appearance-none ${disabled ? 'bg-gray-100 text-gray-500' : ''}`}>
        <option value="">{placeholder}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
);

const MessageDisplay = ({ message }) => {
    if (!message.text) return null;
    return (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-sm mt-4 p-3 rounded-lg border flex items-center ${message.type === 'success' ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
            {message.text}
        </motion.p>
    );
};

const Sidebar = ({ navItems, admin, handleLogout }) => (
    <aside className="hidden lg:flex flex-col w-72 fixed inset-y-0 bg-white border-r border-gray-100 shadow-xl/5 z-40">
      <div className="px-6 h-20 flex items-center gap-3 border-b border-gray-100">
        <GraduationCap className="w-8 h-8 text-indigo-600" />
        <h1 className="text-xl font-bold text-slate-800">AcademicShedular</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <Link key={item.name} to={item.href} className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 font-medium hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
            <item.icon size={20} />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <User className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="truncate">
            <p className="font-semibold text-sm truncate">{admin?.name || "Admin User"}</p>
            <p className="text-xs text-slate-500 truncate">{admin?.email}</p>
          </div>
          <button onClick={handleLogout} className="ml-auto p-2 rounded-lg text-slate-500 hover:bg-gray-100 transition-colors">
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="fixed inset-0 bg-gray-900/60 z-40" onClick={() => setIsOpen(false)} />
          <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="fixed top-0 left-0 bottom-0 w-64 bg-white z-50 flex flex-col shadow-2xl">
            <div className="px-6 h-20 flex items-center justify-between border-b border-gray-100">
              <Link to="/admin" className="flex items-center gap-3 text-lg font-bold text-slate-800">
                <GraduationCap className="w-7 h-7 text-indigo-600" />
                AcademicShedular
              </Link>
              <button onClick={() => setIsOpen(false)} className="p-2 -mr-2 rounded-lg text-slate-600 hover:bg-gray-100"><X size={20} /></button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navItems.map((item) => (
                <Link key={item.name} to={item.href} className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 font-medium hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
            <div className="px-4 py-4 border-t border-gray-100">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-600 font-medium hover:bg-red-50 transition-colors">
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );