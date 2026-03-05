import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  LayoutDashboard, Users2, CalendarCheck, Settings,
  GraduationCap, Plus, Loader2, Menu, BookOpen,
  AlertCircle, Save, Split, Trash2, Edit, X, Clock, Calendar
} from "lucide-react";

// --- SIDEBAR COMPONENT ---
const Sidebar = ({ navItems, handleLogout }) => (
  <aside className="hidden lg:flex flex-col w-72 fixed inset-y-0 bg-white border-r border-gray-200 z-50">
    <div className="h-16 flex items-center px-6 border-b border-gray-100">
      <div className="p-1.5 bg-indigo-600 rounded-lg text-white mr-2"><GraduationCap size={20} /></div>
      <span className="font-bold text-slate-800 text-lg">Scheduler</span>
    </div>
    <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
      {navItems.map((item) => (
        <a key={item.name} href={item.href} className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${item.name === 'Dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
          <item.icon size={20} /> {item.name}
        </a>
      ))}
    </div>
    <div className="p-4 border-t border-gray-100">
      <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all">
        <Settings size={20} /> Logout
      </button>
    </div>
  </aside>
);

const MobileSidebar = ({ isOpen, setIsOpen, navItems, handleLogout }) => (
  isOpen ? (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl p-4 flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <span className="font-bold text-lg">Menu</span>
          <button onClick={() => setIsOpen(false)}><Menu size={20} /></button>
        </div>
        {navItems.map((item) => (
          <a key={item.name} href={item.href} className="flex items-center gap-3 px-4 py-3 mb-2 text-sm font-medium text-slate-600 rounded-lg hover:bg-slate-50">
            <item.icon size={20} /> {item.name}
          </a>
        ))}
        <button onClick={handleLogout} className="mt-auto flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 bg-red-50 rounded-lg">Logout</button>
      </div>
    </div>
  ) : null
);

// --- MAIN DASHBOARD COMPONENT ---

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(null);

  // --- DATA STATE ---
  const [standardAllocations, setStandardAllocations] = useState([]);
  const [electiveAllocations, setElectiveAllocations] = useState([]);
  const [manualAllocations, setManualAllocations] = useState([]); // Added Manual State

  const [allCourses, setAllCourses] = useState([]);
  const [allStaff, setAllStaff] = useState([]);

  // --- FORMS ---
  const [form, setForm] = useState({ staffId: "", courseId: "", year: "", section: "", periods: "", lab: "", isLab: false });
  const [electiveForm, setElectiveForm] = useState({ staffId: "", courseId: "", year: "", section: "", periods: "" });
  const [manualForm, setManualForm] = useState({ year: "", section: "", day: "Monday", period: "1", staffId: "", courseId: "" });

  // --- EDIT STATE ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState(null); // The object being edited
  const [editType, setEditType] = useState(""); // 'Core', 'Elective', 'Manual'
  const [updateLoading, setUpdateLoading] = useState(false);

  // --- UI STATE ---
  const [loading, setLoading] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [electiveLoading, setElectiveLoading] = useState(false);
  
  const [error, setError] = useState("");
  const [manualError, setManualError] = useState("");
  const [electiveError, setElectiveError] = useState("");
  const [generating, setGenerating] = useState(false);

  const navigate = useNavigate();

  // --- AUTH ---
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

  // --- FETCH DATA ---
  const fetchInitialData = async (token) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [coursesRes, staffRes, coreRes, elecRes, manualRes] = await Promise.all([
        axios.get("http://localhost:5000/api/courses", { headers }),
        axios.get("http://localhost:5000/api/staff", { headers }),
        axios.get("http://localhost:5000/api/allocations", { headers }),
        axios.get("http://localhost:5000/api/elective-allocations", { headers }),
        axios.get("http://localhost:5000/api/manualallocations", { headers }) // Fetch Manual
      ]);

      // Process Courses
      let standardCourses = coursesRes.data.courses || [];
      standardCourses = standardCourses.map(c => ({ ...c, type: "Core", isElective: false }));

      let electiveCoursesList = [];
      try {
        const electivesRes = await axios.get("http://localhost:5000/api/elective-courses", { headers });
        const rawElectives = electivesRes.data.electives || electivesRes.data || [];
        electiveCoursesList = rawElectives.map(e => ({
          ...e,
          isElective: true,
          type: "Elective",
          _staffIdStr: e.staffId?._id || e.staffId
        }));
      } catch (elecErr) {
        console.warn("Could not fetch elective courses definitions:", elecErr.message);
      }

      setAllCourses([...standardCourses, ...electiveCoursesList]);
      setAllStaff(staffRes.data.staff || []);
      setStandardAllocations(coreRes.data.allocations || []);
      setElectiveAllocations(elecRes.data || []);
      setManualAllocations(manualRes.data.manualAllocations || []); // Set Manual

    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Failed to load data.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // --- FILTERS (Memoized) ---
  const filteredCourses = useMemo(() => {
    return allCourses.filter(course => {
      if (course.isElective || course.type === "Elective") return false;
      if (!form.staffId) return false;
      const assignedStaffId = course.staffId?._id || course.staffId;
      const creatorId = course.CreatedBy?._id || course.CreatedBy;
      if (assignedStaffId) return String(assignedStaffId) === String(form.staffId);
      return String(creatorId) === String(form.staffId);
    });
  }, [allCourses, form.staffId]);

  const filteredElectiveCourses = useMemo(() => {
    return allCourses.filter(c => {
      if (!c.isElective && c.type !== "Elective") return false;
      if (electiveForm.year && c.year !== electiveForm.year) return false;
      if (electiveForm.staffId) {
        const courseStaffId = c.staffId?._id || c.staffId;
        if (String(courseStaffId) === String(electiveForm.staffId)) return true;
        return false;
      }
      return true;
    });
  }, [allCourses, electiveForm.year, electiveForm.staffId]);

  // Manual Filters
  const manualYearCourses = useMemo(() => {
    if (!manualForm.year) return [];
    return allCourses.filter(c => c.year === manualForm.year);
  }, [allCourses, manualForm.year]);

  const filteredManualStaff = useMemo(() => {
    if (!manualForm.year) return allStaff;
    const staffIdsInYear = manualYearCourses.map(c => c.staffId?._id || c.staffId);
    return allStaff.filter(s => staffIdsInYear.includes(s._id));
  }, [manualYearCourses, allStaff, manualForm.year]);

  const filteredManualSubjects = useMemo(() => {
    if (!manualForm.staffId || !manualForm.year) return [];
    return manualYearCourses.filter(c => {
      const sId = c.staffId?._id || c.staffId;
      return String(sId) === String(manualForm.staffId);
    });
  }, [manualYearCourses, manualForm.staffId, manualForm.year]);


  // --- HANDLERS (Create) ---
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "staffId") {
      setForm({ ...form, staffId: value, courseId: "", year: "" });
    } else if (name === "courseId") {
      const selectedCourse = allCourses.find(course => course._id === value);
      setForm({ ...form, courseId: value, year: selectedCourse ? selectedCourse.year : "" });
    } else {
      setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    }
  };

  const handleManualChange = (e) => {
    const { name, value } = e.target;
    setManualForm(prev => {
      const newData = { ...prev, [name]: value };
      if (name === "year") { newData.staffId = ""; newData.courseId = ""; }
      if (name === "staffId") { newData.courseId = ""; }
      return newData;
    });
  };

  const handleElectiveChange = (e) => {
    const { name, value } = e.target;
    if (name === "staffId") setElectiveForm({ ...electiveForm, staffId: value, courseId: "" });
    else setElectiveForm({ ...electiveForm, [name]: value });
  };

  // --- API SUBMITS (Create) ---
  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!form.staffId || !form.courseId || !form.year || !form.section || !form.periods) {
      setError("Please fill all fields."); return;
    }
    setLoading(true); setError("");
    try {
      const token = localStorage.getItem("token");
      const payload = { ...form, isLab: form.lab && parseInt(form.lab) > 0, type: "Core" };
      const { data } = await axios.post("http://localhost:5000/api/allocations", payload, { headers: { Authorization: `Bearer ${token}` } });
      setStandardAllocations([data.allocation, ...standardAllocations]);
      setForm({ staffId: "", courseId: "", year: "", section: "", periods: "", lab: "", isLab: false });
    } catch (err) { setError(err.response?.data?.message || "Failed."); }
    finally { setLoading(false); }
  };

  const handleElectiveSubmit = async (e) => {
    e.preventDefault();
    if (!electiveForm.staffId || !electiveForm.courseId || !electiveForm.year || !electiveForm.section || !electiveForm.periods) {
      setElectiveError("Please fill all fields."); return;
    }
    setElectiveLoading(true); setElectiveError("");
    try {
      const token = localStorage.getItem("token");
      const payload = { ...electiveForm };
      const { data } = await axios.post("http://localhost:5000/api/elective-allocations", payload, { headers: { Authorization: `Bearer ${token}` } });
      setElectiveAllocations([data.allocation, ...electiveAllocations]);
      setElectiveForm(prev => ({ ...prev, section: "" }));
      alert("Elective Assigned Successfully!");
    } catch (err) { setElectiveError(err.response?.data?.message || "Failed."); }
    finally { setElectiveLoading(false); }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setManualLoading(true); setManualError("");
    try {
      const token = localStorage.getItem("token");
      const payload = {
        year: manualForm.year,
        section: manualForm.section,
        day: manualForm.day,
        period: parseInt(manualForm.period),
        staffId: manualForm.staffId,
        courseId: manualForm.courseId
      };
      const { data } = await axios.post("http://localhost:5000/api/manualallocations/", payload, { headers: { Authorization: `Bearer ${token}` } });
      
      // Update state with new manual allocation (assuming API returns it)
      const newAllocation = data.allocation || data; // Adjust based on actual API return
      // We might need to refetch or manually construct the object if API doesn't return full populated object
      // For now, let's trigger a refetch to be safe, or append if formatted correctly
      fetchInitialData(token); 
      
      alert("Manual slot assigned successfully!");
      setManualForm({ year: "", section: "", day: "Monday", period: "1", staffId: "", courseId: "" });
    } catch (err) { setManualError(err.response?.data?.message || "Failed."); }
    finally { setManualLoading(false); }
  };

  // --- DELETE HANDLER ---
  const handleDeleteAllocation = async (id, type) => {
    if (!window.confirm("Delete allocation?")) return;
    const token = localStorage.getItem("token");
    try {
      if (type === 'Elective') {
        await axios.delete(`http://localhost:5000/api/elective-allocations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setElectiveAllocations(electiveAllocations.filter((item) => item._id !== id));
      } else if (type === 'Manual') {
        await axios.delete(`http://localhost:5000/api/manualallocations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setManualAllocations(manualAllocations.filter((item) => item._id !== id));
      } else {
        await axios.delete(`http://localhost:5000/api/allocations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setStandardAllocations(standardAllocations.filter((item) => item._id !== id));
      }
    } catch (err) { alert("Delete failed."); }
  };

  // --- EDIT HANDLERS ---
  const handleEditClick = (item, type) => {
    setEditData({ ...item }); // Clone data
    setEditType(type);
    setIsEditModalOpen(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (editType === 'Core') {
        const payload = {
          periods: editData.periods,
          section: editData.section,
          year: editData.year,
          lab: editData.lab
        };
        const { data } = await axios.put(`http://localhost:5000/api/allocations/${editData._id}`, payload, { headers });
        // Update local state
        setStandardAllocations(prev => prev.map(item => item._id === editData._id ? { ...item, ...data.allocation } : item));
      } 
      else if (editType === 'Elective') {
        const payload = {
          periods: editData.periods,
          section: editData.section,
          year: editData.year
        };
        const { data } = await axios.put(`http://localhost:5000/api/elective-allocations/${editData._id}`, payload, { headers });
        setElectiveAllocations(prev => prev.map(item => item._id === editData._id ? { ...item, ...data.allocation } : item));
      } 
      else if (editType === 'Manual') {
        // For Manual, we likely update day, period, section
        const payload = {
            day: editData.day,
            period: editData.period,
            section: editData.section,
            year: editData.year
        };
        const { data } = await axios.put(`http://localhost:5000/api/manualallocations/${editData._id}`, payload, { headers });
        setManualAllocations(prev => prev.map(item => item._id === editData._id ? { ...item, ...data.allocation } : item));
      }

      setIsEditModalOpen(false);
      setEditData(null);
    } catch (err) {
      alert(err.response?.data?.message || "Update Failed");
    } finally {
      setUpdateLoading(false);
    }
  };


  const handleGenerateTimetable = async () => {
    if (!window.confirm("Generate new timetable? This will overwrite existing schedules.")) return;
    setGenerating(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post("http://localhost:5001/api/generate-timetable", {}, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) navigate("/admin/timetable", { state: { timetableData: response.data.timetable } });
      else alert("Generation failed: " + response.data.message);
    } catch (err) { alert("Generator Server Error."); }
    finally { setGenerating(false); }
  };

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/admin" },
    { name: "Staff Management", icon: Users2, href: "/admin/staff-management" },
    { name: "TimeTable View", icon: CalendarCheck, href: "/admin/timetable" },
    { name: "Settings", icon: Settings, href: "/admin/settings" },
    { name: "Staff Timetable", icon: Calendar, href: "/admin/staff-timetable" },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Sidebar navItems={navItems} handleLogout={handleLogout} />
      <MobileSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} navItems={navItems} handleLogout={handleLogout} />

      <div className="lg:pl-72 min-h-screen flex flex-col transition-all duration-300">
        <header className="lg:hidden sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-30 shadow-sm px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-lg">
            <div className="p-1.5 bg-indigo-600 rounded-lg text-white"><GraduationCap size={20} /></div>
            <span>Scheduler</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg"><Menu size={24} /></button>
        </header>

        <main className="flex-1 p-4 md:p-8 space-y-8 pb-24">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-500 text-sm mt-1">Manage academic allocations and schedule generation.</p>
            </div>
            <div className="hidden md:flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">{admin?.name?.charAt(0) || "A"}</div>
              <p className="text-sm font-semibold text-slate-900">{admin?.name}</p>
            </div>
          </div>

          <StatsOverview 
            totalStaff={allStaff.length} 
            totalCourses={allCourses.length} 
            allocations={standardAllocations.length + electiveAllocations.length + manualAllocations.length} 
          />

          {/* Standard Allocation Form */}
          <AddAllocationForm form={form} handleChange={handleChange} handleAddStaff={handleAddStaff} loading={loading} error={error} allStaff={allStaff} filteredCourses={filteredCourses} isStaffSelected={!!form.staffId} />

          {/* Elective Allocation Form */}
          <ElectiveAllocationForm form={electiveForm} handleChange={handleElectiveChange} handleSubmit={handleElectiveSubmit} loading={electiveLoading} error={electiveError} allStaff={allStaff} courses={filteredElectiveCourses} isStaffSelected={!!electiveForm.staffId} />

          {/* TABLE 1: STANDARD/CORE ALLOCATIONS */}
          <StandardAllocationsList
            allocations={standardAllocations}
            handleDelete={(id) => handleDeleteAllocation(id, 'Core')}
            handleEdit={(item) => handleEditClick(item, 'Core')}
          />

          {/* TABLE 2: ELECTIVE ALLOCATIONS */}
          <ElectiveAllocationsList
            allocations={electiveAllocations}
            handleDelete={(id) => handleDeleteAllocation(id, 'Elective')}
            handleEdit={(item) => handleEditClick(item, 'Elective')}
          />

          {/* Manual Allocation Form */}
          <ManualAllocationForm
            manualForm={manualForm}
            handleManualChange={handleManualChange}
            handleManualSubmit={handleManualSubmit}
            filteredSubjects={filteredManualSubjects}
            filteredStaff={filteredManualStaff}
            loading={manualLoading}
            error={manualError}
          />

          {/* TABLE 3: MANUAL ALLOCATIONS */}
          <ManualAllocationsList 
            allocations={manualAllocations}
            handleDelete={(id) => handleDeleteAllocation(id, 'Manual')}
            handleEdit={(item) => handleEditClick(item, 'Manual')}
          />

          <GenerateButton handleGenerate={handleGenerateTimetable} generating={generating} count={standardAllocations.length + electiveAllocations.length + manualAllocations.length} />
        </main>
      </div>

      {/* EDIT MODAL */}
      <EditAllocationModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        editData={editData}
        setEditData={setEditData}
        type={editType}
        onSubmit={handleUpdateSubmit}
        loading={updateLoading}
      />

    </div>
  );
}

// --- SUB COMPONENTS ---

const StatsOverview = ({ totalStaff, totalCourses, allocations }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {[
      { label: "Total Staff", value: totalStaff, icon: Users2, color: "text-blue-600", bg: "bg-blue-50" },
      { label: "Active Courses", value: totalCourses, icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50" },
      { label: "Total Allocations", value: allocations, icon: Split, color: "text-green-600", bg: "bg-green-50" },
    ].map((stat, idx) => (
      <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
        <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}><stat.icon size={24} /></div>
        <div><p className="text-slate-500 text-sm font-medium">{stat.label}</p><h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3></div>
      </motion.div>
    ))}
  </div>
);

const AddAllocationForm = ({ form, handleChange, handleAddStaff, loading, error, allStaff, filteredCourses, isStaffSelected }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 flex items-center gap-2"><Plus size={18} className="text-indigo-600" /> Standard Allocation</h3>
      </div>
      <div className="p-6">
        <form onSubmit={handleAddStaff} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-end">
          <div className="lg:col-span-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Faculty Name</label>
            <select name="staffId" value={form.staffId} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg p-2.5">
              <option value="">Select Faculty</option>
              {allStaff.map(opt => <option key={opt._id} value={opt._id}>{opt.name}</option>)}
            </select>
          </div>
          <div className="lg:col-span-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Core Course</label>
            <select name="courseId" value={form.courseId} onChange={handleChange} disabled={!isStaffSelected} className={`w-full border text-sm rounded-lg p-2.5 ${!isStaffSelected ? 'bg-gray-100' : 'bg-slate-50 border-slate-200'}`}>
              <option value="">{isStaffSelected ? "Select Course" : "Choose Faculty First"}</option>
              {filteredCourses.map(opt => <option key={opt._id} value={opt._id}>{opt.name} ({opt.code})</option>)}
            </select>
          </div>
          <div className="lg:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Year</label>
            <select name="year" value={form.year} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg p-2.5">
              <option value="">-</option>
              {["I", "II", "III", "IV"].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="lg:col-span-1"><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sec</label><input type="text" name="section" value={form.section} onChange={handleChange} placeholder="A" className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg p-2.5" /></div>
          <div className="lg:col-span-1"><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Lab</label><input type="number" name="lab" value={form.lab} onChange={handleChange} placeholder="-" className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg p-2.5" /></div>
          <div className="lg:col-span-1"><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Periods</label><input type="number" name="periods" value={form.periods} onChange={handleChange} placeholder="5" className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg p-2.5" /></div>
          <div className="lg:col-span-2">
            <button type="submit" disabled={loading} className="w-full text-white bg-indigo-600 hover:bg-indigo-700 font-bold rounded-lg text-sm px-5 py-2.5 flex justify-center items-center gap-2">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Add
            </button>
          </div>
        </form>
        {error && <div className="mt-4 p-3 text-sm text-red-700 bg-red-50 rounded-lg flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}
      </div>
    </div>
  </motion.div>
);

const ElectiveAllocationForm = ({ form, handleChange, handleSubmit, loading, error, allStaff, courses, isStaffSelected }) => (
  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-8">
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-amber-50/50 flex items-center justify-between">
        <h3 className="font-bold text-amber-800 flex items-center gap-2"><Split size={18} className="text-amber-600" /> Assign Elective Course</h3>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-4 items-end">
          <div className="lg:col-span-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Faculty Name</label>
            <select name="staffId" value={form.staffId} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg p-2.5">
              <option value="">Select Faculty</option>
              {allStaff.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div className="lg:col-span-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Elective Course</label>
            <select name="courseId" value={form.courseId} onChange={handleChange} disabled={!isStaffSelected} className={`w-full border text-sm rounded-lg p-2.5 ${!isStaffSelected ? 'bg-gray-100' : 'bg-slate-50 border-slate-200'}`}>
              <option value="">{isStaffSelected ? "Select Elective" : "Select Faculty First"}</option>
              {courses.length > 0 ? (
                courses.map(c => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)
              ) : (
                <option disabled>{isStaffSelected ? "No electives assigned to this faculty" : "Select Faculty First"}</option>
              )}
            </select>
          </div>
          <div className="lg:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Year</label>
            <select name="year" value={form.year} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg p-2.5">
              <option value="">-</option>
              {["III", "IV"].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="lg:col-span-1"><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sec</label><select name="section" value={form.section} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg p-2.5"><option value="">-</option>{["A", "B", "C", "D", "E"].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
          <div className="lg:col-span-1"><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Periods</label><input type="number" name="periods" value={form.periods} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg p-2.5" placeholder="3" /></div>
          <div className="lg:col-span-1">
            <button type="submit" disabled={loading} className="w-full text-white bg-amber-600 hover:bg-amber-700 font-bold rounded-lg text-sm px-3 py-2.5 flex justify-center items-center gap-2">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Add
            </button>
          </div>
        </form>
        {error && <div className="mt-4 p-3 text-sm text-red-700 bg-red-50 rounded-lg flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}
      </div>
    </div>
  </motion.div>
);

const ManualAllocationForm = ({ manualForm, handleManualChange, handleManualSubmit, filteredSubjects, filteredStaff, loading, error }) => (
  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-8">
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-emerald-50/50 flex items-center justify-between">
        <h3 className="font-bold text-emerald-800 flex items-center gap-2"><Clock size={18} className="text-emerald-600" /> Manual Slot Assignment</h3>
      </div>
      <div className="p-6">
        <form onSubmit={handleManualSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 items-end">
          <div className="lg:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Year</label>
            <select name="year" value={manualForm.year} onChange={handleManualChange} className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg p-2.5">
              <option value="">Select</option>
              {["I", "II", "III", "IV"].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="lg:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Section</label>
            <input name="section" value={manualForm.section} onChange={handleManualChange} className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg p-2.5" placeholder="A" />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Day</label>
            <select name="day" value={manualForm.day} onChange={handleManualChange} className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg p-2.5">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="lg:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Period</label>
            <select name="period" value={manualForm.period} onChange={handleManualChange} className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg p-2.5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="lg:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Faculty</label>
            <select name="staffId" value={manualForm.staffId} onChange={handleManualChange} disabled={!manualForm.year} className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg p-2.5">
              <option value="">Select</option>
              {filteredStaff.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div className="lg:col-span-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Subject</label>
            <select name="courseId" value={manualForm.courseId} onChange={handleManualChange} disabled={!manualForm.staffId} className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg p-2.5">
              <option value="">Select</option>
              {filteredSubjects.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="lg:col-span-1">
            <button type="submit" disabled={loading} className="w-full text-white bg-emerald-600 hover:bg-emerald-700 font-bold rounded-lg text-sm px-3 py-2.5 flex justify-center items-center gap-2">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save
            </button>
          </div>
        </form>
        {error && <div className="mt-4 p-3 text-sm text-red-700 bg-red-50 rounded-lg flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}
      </div>
    </div>
  </motion.div>
);

const StandardAllocationsList = ({ allocations, handleDelete, handleEdit }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
      <h3 className="font-bold text-slate-800 flex items-center gap-2"><BookOpen size={18} className="text-indigo-600" /> Core Allocations</h3>
      <span className="text-xs font-medium px-2 py-1 bg-white border border-gray-200 rounded-md text-slate-500">{allocations.length} entries</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-slate-600">
        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="px-6 py-3">Faculty</th>
            <th className="px-6 py-3">Core Course</th>
            <th className="px-6 py-3">Code</th>
            <th className="px-6 py-3">Type</th>
            <th className="px-6 py-3">Year/Sec</th>
            <th className="px-6 py-3">Lab</th>
            <th className="px-6 py-3">Periods</th>
            <th className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {allocations.length > 0 ? (
            allocations.map((item) => (
              <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-3 font-medium text-slate-900">{item.staffId?.name || "Unknown"}</td>
                <td className="px-6 py-3 text-indigo-700 font-medium">{item.courseId?.name || "Unknown Course"}</td>
                <td className="px-6 py-3 text-slate-400 font-mono text-xs">{item.courseId?.code || "-"}</td>
                <td className="px-6 py-3"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Core</span></td>
                <td className="px-6 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">{item.year} - {item.section}</span></td>
                <td className="px-6 py-3 text-slate-500">{item.lab ? `Lab ${item.lab}` : "-"}</td>
                <td className="px-6 py-3 font-semibold text-slate-700">{item.periods}</td>
                <td className="px-6 py-3 text-right">
                  <button onClick={() => handleEdit(item)} className="text-slate-400 hover:text-indigo-600 transition-colors p-1 mr-2"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(item._id)} className="text-slate-400 hover:text-red-600 transition-colors p-1"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="8" className="px-6 py-8 text-center text-slate-400">No core allocations yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </motion.div>
);

const ElectiveAllocationsList = ({ allocations, handleDelete, handleEdit }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
    <div className="px-6 py-4 border-b border-gray-100 bg-amber-50 flex items-center justify-between">
      <h3 className="font-bold text-amber-900 flex items-center gap-2"><Split size={18} className="text-amber-600" /> Elective Allocations</h3>
      <span className="text-xs font-medium px-2 py-1 bg-white border border-gray-200 rounded-md text-slate-500">{allocations.length} entries</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-slate-600">
        <thead className="text-xs text-slate-500 uppercase bg-amber-50/50 border-b border-amber-100">
          <tr>
            <th className="px-6 py-3">Faculty</th>
            <th className="px-6 py-3">Elective Course</th>
            <th className="px-6 py-3">Code</th>
            <th className="px-6 py-3">Type</th>
            <th className="px-6 py-3">Year/Sec</th>
            <th className="px-6 py-3">Periods</th>
            <th className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {allocations.length > 0 ? (
            allocations.map((item) => (
              <tr key={item._id} className="hover:bg-amber-50/20 transition-colors">
                <td className="px-6 py-3 font-medium text-slate-900">{item.staffId?.name || "Unknown"}</td>
                <td className="px-6 py-3 text-amber-700 font-medium">{item.courseId?.name || "Unknown Course"}</td>
                <td className="px-6 py-3 text-slate-400 font-mono text-xs">{item.courseId?.code || "-"}</td>
                <td className="px-6 py-3"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Elective</span></td>
                <td className="px-6 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">{item.year} - {item.section || "All"}</span></td>
                <td className="px-6 py-3 font-semibold text-slate-700">{item.periods}</td>
                <td className="px-6 py-3 text-right">
                  <button onClick={() => handleEdit(item)} className="text-slate-400 hover:text-indigo-600 transition-colors p-1 mr-2"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(item._id)} className="text-slate-400 hover:text-red-600 transition-colors p-1"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-400">No elective allocations yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </motion.div>
);

const ManualAllocationsList = ({ allocations, handleDelete, handleEdit }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
    <div className="px-6 py-4 border-b border-gray-100 bg-emerald-50 flex items-center justify-between">
      <h3 className="font-bold text-emerald-900 flex items-center gap-2"><Clock size={18} className="text-emerald-600" /> Manual Allocations</h3>
      <span className="text-xs font-medium px-2 py-1 bg-white border border-gray-200 rounded-md text-slate-500">{allocations.length} entries</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-slate-600">
        <thead className="text-xs text-slate-500 uppercase bg-emerald-50/50 border-b border-emerald-100">
          <tr>
            <th className="px-6 py-3">Faculty</th>
            <th className="px-6 py-3">Subject</th>
            <th className="px-6 py-3">Year/Sec</th>
            <th className="px-6 py-3">Day</th>
            <th className="px-6 py-3">Period</th>
            <th className="px-6 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {allocations.length > 0 ? (
            allocations.map((item) => (
              <tr key={item._id} className="hover:bg-emerald-50/20 transition-colors">
                <td className="px-6 py-3 font-medium text-slate-900">{item.staffId?.name || "Unknown"}</td>
                <td className="px-6 py-3 text-emerald-700 font-medium">{item.courseId?.name || "Unknown Course"}</td>
                <td className="px-6 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">{item.year} - {item.section || "A"}</span></td>
                <td className="px-6 py-3 text-slate-700">{item.day}</td>
                <td className="px-6 py-3 font-semibold text-slate-700">{item.period}</td>
                <td className="px-6 py-3 text-right">
                  <button onClick={() => handleEdit(item)} className="text-slate-400 hover:text-indigo-600 transition-colors p-1 mr-2"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(item._id)} className="text-slate-400 hover:text-red-600 transition-colors p-1"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-400">No manual allocations yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  </motion.div>
);

const GenerateButton = ({ handleGenerate, generating, count }) => (
  <div className="fixed bottom-8 right-8 z-40">
    <button
      onClick={handleGenerate}
      disabled={generating || count === 0}
      className={`shadow-lg shadow-indigo-600/30 flex items-center gap-3 px-6 py-4 rounded-full font-bold text-white transition-all transform hover:scale-105 active:scale-95 ${generating || count === 0 ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 hover:bg-indigo-700'}`}
    >
      {generating ? <Loader2 size={24} className="animate-spin" /> : <CalendarCheck size={24} />}
      {generating ? "Generating..." : "Generate Timetable"}
    </button>
  </div>
);

// --- EDIT MODAL COMPONENT ---
const EditAllocationModal = ({ isOpen, onClose, editData, setEditData, type, onSubmit, loading }) => {
  if (!isOpen || !editData) return null;

  const handleChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h3 className="font-bold text-lg text-slate-800">Edit {type} Allocation</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition"><X size={20} className="text-slate-500"/></button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Year</label>
              <select name="year" value={editData.year || ""} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm">
                 {["I", "II", "III", "IV"].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Section</label>
               <input name="section" value={editData.section || ""} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm" />
            </div>
          </div>

          {/* Type Specific Fields */}
          {type === 'Core' && (
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Periods</label>
                 <input type="number" name="periods" value={editData.periods || ""} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lab Group</label>
                  <input type="number" name="lab" value={editData.lab || ""} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm" placeholder="0 if none" />
               </div>
             </div>
          )}

          {type === 'Elective' && (
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Periods</label>
               <input type="number" name="periods" value={editData.periods || ""} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm" />
             </div>
          )}

          {type === 'Manual' && (
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Day</label>
                 <select name="day" value={editData.day || ""} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(d => <option key={d} value={d}>{d}</option>)}
                 </select>
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Period</label>
                  <select name="period" value={editData.period || ""} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
               </div>
             </div>
          )}

          <div className="pt-2">
            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg text-sm flex justify-center items-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Update Allocation
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};