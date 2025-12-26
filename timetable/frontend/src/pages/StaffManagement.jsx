// --- FacultyManagement.jsx ---
import React, { useState, useEffect, useMemo } from "react";
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
  PlusCircle,
  User,
  Loader2,
  X,
  Trash2,
  Edit2,
  Mail,
  Smartphone,
  Info,
  Layers,
  ArrowLeft,
  Search,
  Filter,
} from "lucide-react";

// ----------------------------------------------------------------------------------
// --- REUSABLE FORM FIELD COMPONENTS ---
// ----------------------------------------------------------------------------------

const InputField = ({ label, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <input {...props} className="w-full border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-inner text-base h-11" />
  </div>
);

const SelectField = ({ label, name, value, onChange, options, placeholder }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <select 
        name={name} 
        value={value} 
        onChange={onChange} 
        className="w-full border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-inner text-base h-11 bg-white appearance-none"
      >
        <option value="">{placeholder}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );

const ObjectSelectField = ({ label, name, value, onChange, options, valueKey, labelKey, placeholder }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <select 
        name={name} 
        value={value} 
        onChange={onChange} 
        className="w-full border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-inner text-base h-11 bg-white appearance-none"
      >
        <option value="">{placeholder}</option>
        {options.map(opt => <option key={opt[valueKey]} value={opt[valueKey]}>{opt[labelKey]}</option>)}
      </select>
    </div>
  );

const DEPARTMENT_OPTIONS = [
    "Computer Science", 
    "Physics", 
    "Chemistry", 
    "EEE", 
    "ECE"
];

export default function FacultyManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [facultyList, setFacultyList] = useState([]); 
  const [form, setForm] = useState({ name: "", email: "", mobile: "", department: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null); 
  const [facultyAllocations, setFacultyAllocations] = useState([]); 
  const [allCourses, setAllCourses] = useState([]); 
  
  // New state for Search and Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');

  const navigate = useNavigate();
  const API_BASE_URL = "http://localhost:5000/api/staff"; 

  // --- Auth Check & Initial Data Load ---
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

  // --- Data Fetching ---
  const fetchInitialData = async (token) => {
    try {
        const [staffRes, coursesRes] = await Promise.all([
            // Use the base staff route to get all faculty
            axios.get(API_BASE_URL, { headers: { Authorization: `Bearer ${token}` } }), 
            axios.get("http://localhost:5000/api/courses", { headers: { Authorization: `Bearer ${token}` } })
        ]);

        // Ensure we handle the case where backend sends staff directly or wrapped in 'staff' property
        setFacultyList(staffRes.data.staff || staffRes.data || []); 
        setAllCourses(coursesRes.data.courses || []);
        setError("");
    } catch (err) {
      console.error("Data fetch error:", err);
      setError("Failed to fetch initial data.");
    }
  };

  const fetchFacultyDetails = async (facultyId, token) => {
    try {
        const { data } = await axios.get(`http://localhost:5000/api/staff-allocations/staff/${facultyId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setFacultyAllocations(data.allocations || []);
    } catch (err) {
        console.error("Allocations fetch error:", err);
        // Do not set error globally, just log for modal context
        setFacultyAllocations([]); 
    }
  };

  // --- Filtered Faculty List Logic ---
  const filteredFacultyList = useMemo(() => {
    let list = facultyList;
    const searchLower = searchQuery.toLowerCase();
    
    // 1. Filter by Department
    if (filterDepartment) {
        list = list.filter(faculty => faculty.department === filterDepartment);
    }

    // 2. Filter by Search Query (Name or Email or Mobile)
    if (searchQuery) {
        list = list.filter(faculty => 
            faculty.name.toLowerCase().includes(searchLower) ||
            faculty.email.toLowerCase().includes(searchLower) ||
            (faculty.mobile && faculty.mobile.includes(searchQuery))
        );
    }
    
    return list;
  }, [facultyList, searchQuery, filterDepartment]);
  
  // --- Handlers ---
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleAddFaculty = async (e) => { 
    e.preventDefault();
    if (!form.name || !form.email || !form.mobile || !form.department) {
      setError("All fields (Name, Email, Mobile, and Department) are required.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(`${API_BASE_URL}/register`, form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // The backend returns the new staff member (faculty)
      setFacultyList([data, ...facultyList]); 
      setForm({ name: "", email: "", mobile: "", department: "" });
      setMessage(`Faculty member ${data.name} added successfully! Default password is '123456'.`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add faculty member.");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };
  
  const handleViewDetails = (faculty) => { 
    setSelectedFaculty(faculty); 
    const token = localStorage.getItem("token");
    fetchFacultyDetails(faculty._id, token);
    setDetailsModalOpen(true);
  };

  const handleCloseDetails = () => {
    setSelectedFaculty(null);
    setFacultyAllocations([]);
    setDetailsModalOpen(false);
  };

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/admin" },
    { name: "Faculty Management", icon: Users2, href: "/admin/staff-management" }, 
    { name: "TimeTable", icon: BookCopy, href: "/admin/timetable" },
    { name: "Settings", icon: Settings, href: "/admin/settings" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800">
      <Sidebar navItems={navItems} admin={admin} handleLogout={handleLogout} currentPage="Faculty Management" />
      <MobileSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} navItems={navItems} handleLogout={handleLogout} />
      
      <div className="lg:pl-72"> 
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
        
        <main className="p-4 sm:p-6 lg:p-10 space-y-8">
          
          <PageHeader 
            title="Faculty Management" 
            subtitle="Add new faculty members and oversee the current faculty roster." 
            backLink="/admin"
          />

          <AddFacultyForm 
            form={form} 
            handleChange={handleChange} 
            handleAddFaculty={handleAddFaculty} 
            loading={loading} 
            error={error} 
            message={message}
          />
          
          <FacultyFilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterDepartment={filterDepartment}
            setFilterDepartment={setFilterDepartment}
          />

          <FacultyTable 
            facultyList={filteredFacultyList} // Use the filtered list here
            totalCount={facultyList.length} // Display total count of all faculty
            handleViewDetails={handleViewDetails}
            filterActive={!!searchQuery || !!filterDepartment}
          />
        </main>
      </div>

      <FacultyDetailsModal 
        isOpen={detailsModalOpen}
        onClose={handleCloseDetails}
        faculty={selectedFaculty} 
        allocations={facultyAllocations}
        allCourses={allCourses}
        refetchAllocations={() => fetchFacultyDetails(selectedFaculty._id, localStorage.getItem("token"))}
      />
    </div>
  );
}

// -------------------------------------------------------------
// --- SIDEBAR COMPONENTS (Unchanged) ---
// -------------------------------------------------------------

const Sidebar = ({ navItems, admin, handleLogout, currentPage }) => (
    <aside className="hidden lg:flex flex-col w-72 fixed inset-y-0 bg-white border-r border-gray-100 shadow-xl/5 z-40">
      <div className="px-6 h-20 flex items-center gap-3 border-b border-gray-100">
        <GraduationCap className="w-8 h-8 text-indigo-600" />
        <h1 className="text-xl font-bold text-slate-800">AcademicShedular</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = item.name === currentPage;
          return (
            <Link 
              key={item.name} 
              to={item.href} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
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
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            transition={{ duration: 0.3 }} 
            className="fixed inset-0 bg-gray-900/60 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <motion.div 
            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} 
            transition={{ type: "spring", stiffness: 300, damping: 30 }} 
            className="fixed top-0 left-0 bottom-0 w-64 bg-white z-50 flex flex-col shadow-2xl"
          >
            <div className="px-6 h-20 flex items-center justify-between border-b border-gray-100">
              <Link to="/admin" className="flex items-center gap-3 text-lg font-bold text-slate-800">
                <GraduationCap className="w-7 h-7 text-indigo-600" />
                AcademicShedular
              </Link>
              <button onClick={() => setIsOpen(false)} className="p-2 -mr-2 rounded-lg text-slate-600 hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navItems.map((item) => (
                <Link 
                  key={item.name} 
                  to={item.href} 
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 font-medium hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                >
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
            <div className="px-4 py-4 border-t border-gray-100">
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

// -------------------------------------------------------------
// --- PAGE HEADER AND FORMS (Add Faculty Form Unchanged) ---
// -------------------------------------------------------------

const PageHeader = ({ title, subtitle, backLink }) => (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {backLink && (
            <Link 
                to={backLink} 
                className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition mb-4 p-2 -ml-2 rounded-lg hover:bg-indigo-50"
            >
                <ArrowLeft size={16} className="mr-1" />
                Back to Dashboard
            </Link>
        )}
        <h2 className="text-3xl font-extrabold text-gray-900">{title}</h2>
        <p className="text-gray-500 mt-2 text-lg">{subtitle}</p>
        <div className="h-0.5 w-16 bg-indigo-500 mt-2 rounded-full"></div>
    </motion.div>
);

const AddFacultyForm = ({ form, handleChange, handleAddFaculty, loading, error, message }) => (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="bg-white p-8 rounded-2xl shadow-lg ring-1 ring-gray-100">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3 border-b pb-3">
                <PlusCircle size={24} className="text-indigo-600" />
                Register New Faculty Member
            </h3>
            <form onSubmit={handleAddFaculty} className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-end">
                <InputField 
                    label="Full Name" 
                    name="name" 
                    value={form.name} 
                    onChange={handleChange} 
                    placeholder="e.g., Dr. Jane Doe" 
                />
                
                <SelectField 
                    label="Department" 
                    name="department" 
                    value={form.department} 
                    onChange={handleChange} 
                    options={DEPARTMENT_OPTIONS} 
                    placeholder="Select Department" 
                />
                
                <InputField 
                    label="Email Address" 
                    name="email" 
                    type="email" 
                    value={form.email} 
                    onChange={handleChange} 
                    placeholder="e.g., jane@example.edu" 
                />
                <InputField 
                    label="Mobile Number" 
                    name="mobile" 
                    type="tel" 
                    value={form.mobile} 
                    onChange={handleChange} 
                    placeholder="e.g., 9876543210" 
                    maxLength={10}
                />
                
                <div className="md:col-span-2 lg:col-span-4 flex justify-end">
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full md:w-auto bg-indigo-600 text-white font-bold rounded-xl py-3 px-6 hover:bg-indigo-700 transition h-11 flex items-center justify-center disabled:bg-indigo-400"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <User size={20} className="mr-2"/>}
                        {loading ? "Registering..." : "Add Faculty"}
                    </button>
                </div>
            </form>
            {error && <p className="text-sm text-red-700 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">{error}</p>}
            {message && <p className="text-sm text-green-700 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">{message}</p>}
        </div>
    </motion.div>
);

// -------------------------------------------------------------
// --- NEW FILTER BAR COMPONENT ---
// -------------------------------------------------------------

const FacultyFilterBar = ({ searchQuery, setSearchQuery, filterDepartment, setFilterDepartment }) => (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <div className="bg-white p-6 rounded-2xl shadow-lg ring-1 ring-gray-100 flex flex-col sm:flex-row gap-4 items-end">
            
            {/* Search Bar */}
            <div className="relative flex-1 w-full sm:max-w-xs">
                <label htmlFor="faculty-search" className="block text-sm font-medium text-slate-700 mb-1">Search Faculty</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={20} className="text-gray-400" />
                    </div>
                    <input 
                        id="faculty-search"
                        type="text"
                        placeholder="Name, Email, or Mobile"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full border-gray-300 rounded-xl p-3 pl-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-inner text-base h-11"
                    />
                </div>
            </div>

            {/* Department Filter */}
            <div className="w-full sm:max-w-[200px]">
                <label htmlFor="dept-filter" className="block text-sm font-medium text-slate-700 mb-1">Filter by Department</label>
                <select 
                    id="dept-filter"
                    value={filterDepartment} 
                    onChange={(e) => setFilterDepartment(e.target.value)} 
                    className="w-full border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-inner text-base h-11 bg-white appearance-none"
                >
                    <option value="">All Departments</option>
                    {DEPARTMENT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            </div>

            {/* Clear Filters Button */}
            {(searchQuery || filterDepartment) && (
                <button 
                    onClick={() => {
                        setSearchQuery('');
                        setFilterDepartment('');
                    }}
                    className="flex items-center text-sm text-red-600 hover:text-red-800 transition px-3 py-1.5 h-11"
                >
                    <X size={16} className="mr-1"/> Clear Filters
                </button>
            )}
        </div>
    </motion.div>
);

// -------------------------------------------------------------
// --- FACULTY TABLE (Updated to use filtered data) ---
// -------------------------------------------------------------

const FacultyTable = ({ facultyList, handleViewDetails, totalCount, filterActive }) => (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        Faculty Roster 
        <span className="text-base font-medium text-gray-500">
            ({facultyList.length} {filterActive ? `of ${totalCount}` : ''} Total)
        </span>
      </h3>
      <div className="bg-white rounded-2xl shadow-lg ring-1 ring-gray-100 overflow-hidden">
        <div className="overflow-x-auto"> 
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-700 text-left tracking-wider uppercase">Faculty Name</th>
                <th className="px-6 py-4 font-bold text-gray-700 text-left tracking-wider uppercase">Department</th>
                <th className="px-6 py-4 font-bold text-gray-700 text-left tracking-wider uppercase">Mobile Number</th>
                <th className="px-6 py-4 font-bold text-gray-700 text-left tracking-wider uppercase">Email ID</th>
                <th className="px-6 py-4 font-bold text-gray-700 text-center tracking-wider uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {facultyList.length > 0 ? (
                facultyList.map((faculty) => (
                  <tr key={faculty._id} className="hover:bg-indigo-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 font-medium">
                        {faculty.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-indigo-700 font-medium">
                        {/* Now that the model is confirmed, this will show data or N/A */}
                        {faculty.department || 'N/A'} 
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        <span className="flex items-center gap-1 text-sm">
                            <Smartphone size={14} className="text-slate-400"/>
                            {/* Now that the model is confirmed, this will show data or N/A */}
                            {faculty.mobile || 'N/A'}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                        <span className="flex items-center gap-1 text-sm">
                            <Mail size={14} className="text-slate-400"/>
                            {faculty.email}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button 
                            onClick={() => handleViewDetails(faculty)} 
                            className="bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg hover:bg-indigo-600 transition flex items-center justify-center mx-auto text-sm shadow-md"
                        >
                            <Info size={16} className="mr-1" /> Details
                        </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500 bg-gray-50">
                    {filterActive 
                        ? "No faculty members match your current filters."
                        : "No faculty members found. Use the form above to add one."
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
);


// -------------------------------------------------------------
// --- FACULTY DETAILS MODAL (Unchanged) ---
// -------------------------------------------------------------

const FacultyDetailsModal = ({ isOpen, onClose, faculty, allocations, allCourses, refetchAllocations }) => {
    if (!isOpen || !faculty) return null; 

    const [isCourseEditing, setIsCourseEditing] = useState(false);
    const [editForm, setEditForm] = useState({ 
        allocationId: '', staffId: faculty._id, courseId: '', year: '', section: '', periods: '' 
    });
    const [courseError, setCourseError] = useState('');
    const [courseLoading, setCourseLoading] = useState(false);

    const handleEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value });

    const startEditAllocation = (allocation) => {
        setEditForm({
            allocationId: allocation._id,
            staffId: faculty._id,
            courseId: allocation.courseId?._id || '', 
            year: allocation.year,
            section: allocation.section,
            periods: allocation.periods,
        });
        setIsCourseEditing(true);
        setCourseError('');
    };

    const startAddAllocation = () => {
        setEditForm({ 
            allocationId: '', staffId: faculty._id, courseId: '', year: '', section: '', periods: '' 
        });
        setIsCourseEditing(true);
        setCourseError('');
    }

    const handleSaveCourse = async (e) => {
        e.preventDefault();
        if (!editForm.courseId || !editForm.year || !editForm.section || !editForm.periods) {
            setCourseError("All course fields are required.");
            return;
        }

        setCourseLoading(true);
        setCourseError('');
        const token = localStorage.getItem("token");
        
        try {
            if (editForm.allocationId) {
                await axios.put(`http://localhost:5000/api/staff-allocations/update/${editForm.allocationId}`, editForm, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post("http://localhost:5000/api/staff-allocations/add", editForm, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            refetchAllocations(); 
            setIsCourseEditing(false);
            setEditForm({ allocationId: '', staffId: faculty._id, courseId: '', year: '', section: '', periods: '' });
        } catch (err) {
            setCourseError(err.response?.data?.message || "Failed to save course allocation.");
        } finally {
            setCourseLoading(false);
        }
    };
    
    const handleDeleteAllocation = async (allocationId) => {
        if (!window.confirm("Are you sure you want to delete this course allocation?")) return;
        
        setCourseLoading(true);
        const token = localStorage.getItem("token");
        try {
            await axios.delete(`http://localhost:5000/api/staff-allocations/delete/${allocationId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            refetchAllocations();
        } catch (err) {
            setCourseError(err.response?.data?.message || "Failed to delete course allocation.");
        } finally {
            setCourseLoading(false);
        }
    }


    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                        className="fixed inset-0 bg-gray-900/70 z-50" 
                        onClick={onClose} 
                    />
                    {/* Modal Content */}
                    <motion.div 
                        initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} 
                        transition={{ type: "spring", stiffness: 100, damping: 20 }} 
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    >
                        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <h3 className="text-2xl font-bold text-indigo-700 flex items-center gap-2">
                                    <User size={24}/> Faculty Details: {faculty.name} 
                                </h3>
                                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Column 1: Personal Info (Read-Only) */}
                                <div className="lg:col-span-1 border-r pr-6">
                                    <h4 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2"><Info size={18} className="text-indigo-500"/>Personal Information</h4>
                                    
                                    <p className="text-sm mb-2"><span className="font-semibold text-gray-600">Department:</span> <span className="font-medium text-indigo-700">{faculty.department || 'N/A'}</span></p> 
                                    <p className="text-sm mb-2"><span className="font-semibold text-gray-600">Name:</span> {faculty.name}</p>
                                    <p className="text-sm mb-2 flex items-center gap-1"><span className="font-semibold text-gray-600">Email:</span> <Mail size={14} className="text-slate-400"/> {faculty.email}</p>
                                    <p className="text-sm mb-2 flex items-center gap-1"><span className="font-semibold text-gray-600">Mobile:</span> <Smartphone size={14} className="text-slate-400"/> {faculty.mobile || 'N/A'}</p>
                                    <p className="text-xs text-gray-500 mt-4 bg-gray-50 p-3 rounded-lg">Personal details are read-only here. This section is for quick reference.</p>
                                </div>

                                {/* Column 2: Course Allocation & Edit Form */}
                                <div className="lg:col-span-2">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Layers size={18} className="text-indigo-500"/>Course Allocations</h4>
                                        <button 
                                            onClick={startAddAllocation}
                                            className="bg-green-500 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-green-600 transition flex items-center"
                                        >
                                            <PlusCircle size={16} className="mr-1"/> Add New Course
                                        </button>
                                    </div>
                                    
                                    {/* Course Edit/Add Form */}
                                    <AnimatePresence>
                                        {isCourseEditing && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }} 
                                                animate={{ height: "auto", opacity: 1 }} 
                                                exit={{ height: 0, opacity: 0 }} 
                                                className="bg-indigo-50 p-4 rounded-xl mb-4 overflow-hidden"
                                            >
                                                <h5 className="text-md font-semibold text-indigo-800 mb-3">{editForm.allocationId ? 'Edit Course Allocation' : 'New Course Allocation'}</h5>
                                                <form onSubmit={handleSaveCourse} className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
                                                    <div className="sm:col-span-2">
                                                        <ObjectSelectField 
                                                            label="Course" 
                                                            name="courseId" 
                                                            value={editForm.courseId} 
                                                            onChange={handleEditChange} 
                                                            options={allCourses} 
                                                            valueKey="_id" 
                                                            labelKey="acronym" 
                                                            placeholder="Select Course" 
                                                        />
                                                    </div>
                                                    <SelectField label="Year" name="year" value={editForm.year} onChange={handleEditChange} options={["I","II","III","IV"]} placeholder="Year" />
                                                    <InputField label="Section" name="section" value={editForm.section} onChange={handleEditChange} placeholder="Sec" />
                                                    <InputField label="Periods" name="periods" type="number" value={editForm.periods} onChange={handleEditChange} placeholder="Hrs" />
                                                    
                                                    <div className="flex gap-2 sm:col-span-1">
                                                        <button 
                                                            type="submit" 
                                                            disabled={courseLoading} 
                                                            className="w-full bg-indigo-600 text-white font-medium rounded-lg py-2 hover:bg-indigo-700 transition disabled:bg-indigo-400 text-sm h-10"
                                                        >
                                                            {courseLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save"}
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setIsCourseEditing(false)} 
                                                            className="w-full bg-gray-300 text-gray-700 font-medium rounded-lg py-2 hover:bg-gray-400 transition text-sm h-10"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </form>
                                                {courseError && <p className="text-sm text-red-700 mt-2">{courseError}</p>}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* List of Allocated Courses */}
                                    <div className="space-y-3 mt-4">
                                        {allocations.length > 0 ? (
                                            allocations.map(alloc => (
                                                <div key={alloc._id} className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm flex justify-between items-center hover:bg-gray-50 transition">
                                                    <div>
                                                        <p className="font-semibold text-indigo-700">{alloc.courseId?.acronym || 'N/A'}</p>
                                                        <p className="text-xs text-gray-600">Year {alloc.year} / Section {alloc.section} ({alloc.periods} periods)</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => startEditAllocation(alloc)} className="text-indigo-600 hover:text-indigo-800 p-1 rounded-md transition" title="Edit Allocation">
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button onClick={() => handleDeleteAllocation(alloc._id)} className="text-red-600 hover:text-red-800 p-1 rounded-md transition" title="Delete Allocation">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-center text-gray-500 p-4 bg-gray-50 rounded-lg">No courses currently allocated to this faculty member.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};