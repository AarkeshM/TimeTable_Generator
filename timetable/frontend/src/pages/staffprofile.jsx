import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Smartphone,
  Briefcase,
  Users,
  Pencil,
  Check,
  X,
  Loader2,
  AlertTriangle,
  Zap,
  ArrowLeft,
} from "lucide-react";

// ----------------------------------------------------------------------
// --- Helper Components ---
// ----------------------------------------------------------------------

const ProfileDetail = ({ icon: Icon, label, value }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3 }}
    className="flex items-center p-3 bg-slate-50 border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
  >
    <Icon className="w-5 h-5 text-blue-600 mr-4 flex-shrink-0" />
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-base font-semibold text-slate-800">{value || "N/A"}</p>
    </div>
  </motion.div>
);

const InputField = ({ label, icon: Icon, ...props }) => (
  <div>
    <label className="text-sm font-medium text-slate-700 flex items-center mb-1">
      <Icon className="w-4 h-4 mr-2 text-slate-500" />
      {label}
    </label>
    <input
      {...props}
      className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm text-base"
    />
  </div>
);

const SelectField = ({ label, icon: Icon, options, ...props }) => (
  <div>
    <label className="text-sm font-medium text-slate-700 flex items-center mb-1">
      <Icon className="w-4 h-4 mr-2 text-slate-500" />
      {label}
    </label>
    <select
      {...props}
      className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm text-base bg-white"
    >
      <option value="" disabled>Select {label}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

// ----------------------------------------------------------------------
// --- Main Component ---
// ----------------------------------------------------------------------

export default function StaffProfile() {
  const [profile, setProfile] = useState({
    name: "",
    mobile: "",
    email: "",
    department: "",
    gender: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [status, setStatus] = useState({ type: null, message: "" });
  const [loading, setLoading] = useState(false);

  // Department and Gender options
  const departmentOptions = ["Computer Science and Engineering", "Electrical Engineering", "Mathematics", "Physics", "Chemistry"];
  const genderOptions = ["Male", "Female", "Other"];

  // --- UPDATED FETCH FUNCTION ---
  const fetchProfile = async () => {
    setLoading(true);
    setStatus({ type: null, message: "" });
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setStatus({ type: 'error', message: 'Authentication required.' });
        setLoading(false);
        return;
      }

      // Simulate API call delay for smooth UX
      await new Promise(resolve => setTimeout(resolve, 500)); 
      
      const res = await axios.get("http://localhost:5000/api/staff/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // DEBUG: View exactly what the server sends in the console
      console.log("Full API Response:", res.data);

      // ✅ FIX: Intelligently find the data object. 
      // It handles { name: ... } OR { staff: { name: ... } } OR { user: { name: ... } }
      const fetchedData = res.data.staff || res.data.user || res.data.data || res.data;
      
      // Ensure we don't set null/undefined to state which might break controlled inputs
      const safeData = {
        ...fetchedData,
        name: fetchedData.name || "",
        email: fetchedData.email || "",
        mobile: fetchedData.mobile || "",
        department: fetchedData.department || "",
        gender: fetchedData.gender || "",
      };

      if (safeData) {
        setProfile(safeData);
        setForm(safeData);
      } else {
        console.error("Could not locate profile data in response");
      }

    } catch (err) {
      console.error("Fetch profile error:", err);
      const errorMessage = err.response?.data?.message || 'Failed to fetch profile data. Please check the API status.';
      setStatus({ type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdate = async () => {
    setLoading(true);
    setStatus({ type: null, message: "" });
    
    if (!form.name || !form.mobile || !form.department || !form.gender) {
        setLoading(false);
        return setStatus({ type: 'error', message: 'Please ensure all required fields are filled.' });
    }
    
    try {
      const token = localStorage.getItem("token");
      if (!token) return setStatus({ type: 'error', message: 'Authentication required.' });

      await new Promise(resolve => setTimeout(resolve, 800));

      // Note: We usually put the updated data (form) as the second argument
      const res = await axios.put(
        "http://localhost:5000/api/staff/profile",
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Handle response for update as well
      const updatedData = res.data.staff || res.data.user || res.data.data || form;

      setProfile(updatedData); 
      setForm(updatedData); // Sync form
      setEditMode(false);
      setStatus({ type: 'success', message: 'Profile updated successfully!' });
    } catch (err) {
      console.error("Update profile error:", err);
      setStatus({ type: 'error', message: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    setForm(profile); 
    setEditMode(false);
    setStatus({ type: null, message: "" });
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, staggerChildren: 0.1 } },
  };

  // Only show full page loader on initial load if we have NO data yet
  if (loading && !profile.name && !profile.email) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-slate-600">Loading Profile...</span>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 mt-6"
    >
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <Link 
                to="/staff" 
                title="Back to Dashboard"
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition flex-shrink-0"
            >
                <ArrowLeft className="w-6 h-6" />
            </Link>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                <User className="w-7 h-7 text-blue-600" />
                {editMode ? "Edit Profile Details" : "My Staff Profile"}
            </h1>
        </div>
        
        {!editMode && (
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setEditMode(true)}
                className="flex items-center justify-center px-5 py-2.5 w-full sm:w-auto bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:bg-blue-700 transition-colors"
            >
                <Pencil className="w-5 h-5 mr-2" />
                Edit Profile
            </motion.button>
        )}
      </header>

      <AnimatePresence>
        {status.type && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 mb-6 rounded-lg font-medium flex items-center gap-3 ${
              status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {status.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            {status.message}
          </motion.div>
        )}
      </AnimatePresence>

      {!editMode ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileDetail icon={User} label="Full Name" value={profile.name} />
          <ProfileDetail icon={Mail} label="Email Address" value={profile.email} />
          <ProfileDetail icon={Smartphone} label="Mobile Number" value={profile.mobile} />
          <ProfileDetail icon={Briefcase} label="Department" value={profile.department} />
          <ProfileDetail icon={Users} label="Gender" value={profile.gender} />
          
          <div className="md:col-span-2">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 p-4 bg-yellow-50 text-yellow-800 rounded-xl flex items-center gap-3">
                <Zap className="w-5 h-5" />
                <span className="text-sm font-medium">Click "Edit Profile" to modify any details.</span>
            </motion.div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Name"
              icon={User}
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter full name"
            />

            <InputField
              label="Mobile Number"
              icon={Smartphone}
              value={form.mobile || ""}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              placeholder="Enter mobile number"
            />

            <InputField
              label="Email Address (Read-Only)"
              icon={Mail}
              value={form.email || ""}
              readOnly
              disabled
              className="bg-slate-100 cursor-not-allowed text-slate-500"
            />

            <SelectField
              label="Department"
              icon={Briefcase}
              value={form.department || ""}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              options={departmentOptions}
            />
            
            <SelectField
              label="Gender"
              icon={Users}
              value={form.gender || ""}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              options={genderOptions}
            />
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUpdate}
              disabled={loading}
              className="flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-xl shadow-lg hover:bg-green-700 transition-colors disabled:bg-green-400 w-full sm:w-auto"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Check className="w-5 h-5 mr-2" />
              )}
              {loading ? "Updating..." : "Save Changes"}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCancel}
              disabled={loading}
              className="flex items-center justify-center px-6 py-3 bg-gray-500 text-white font-semibold rounded-xl shadow-lg hover:bg-gray-600 transition-colors disabled:bg-gray-400 w-full sm:w-auto"
            >
              <X className="w-5 h-5 mr-2" />
              Cancel
            </motion.button>
          </div>
        </>
      )}
    </motion.div>
  );
}