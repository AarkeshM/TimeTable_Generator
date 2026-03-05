import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, Loader2, CheckCircle, AlertTriangle, ArrowLeft, 
  BookOpen, Layers, Calendar, Edit2, X, Save, Tag
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function StaffCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: null, message: "" });
  
  // --- New State for Editing ---
  const [editingCourse, setEditingCourse] = useState(null); 
  const [isUpdating, setIsUpdating] = useState(false); 
  const [deletingId, setDeletingId] = useState(null);
  
  const navigate = useNavigate();

  // --- Utility Functions ---

  const handleStatus = (type, message) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: null, message: "" }), 5000);
  };

  // --- API Calls ---

  const fetchCourses = async () => {
    setLoading(true);
    setStatus({ type: null, message: "" });
    
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        handleStatus("error", "Authentication token not found. Please log in.");
        setLoading(false);
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Fetch both Core Courses and Elective Courses simultaneously
      const [coursesRes, electivesRes] = await Promise.all([
        axios.get("http://localhost:5000/api/courses/", config).catch(() => ({ data: { courses: [] } })),
        axios.get("http://localhost:5000/api/elective-courses/", config).catch(() => ({ data: { electives: [] } }))
      ]);

      // Tag them with a category so we know which API to call later for updates/deletes
      const coreCourses = (coursesRes.data.courses || []).map(c => ({ ...c, category: 'Core' }));
      // Adjust 'electivesRes.data.electives' if your backend returns a different key
      const electiveCourses = (electivesRes.data.electives || []).map(c => ({ ...c, category: 'Elective' }));

      setCourses([...coreCourses, ...electiveCourses]);
      
    } catch (err) {
      console.error("Failed to load courses:", err);
      if (err.response?.status === 401) {
         handleStatus("error", "Session expired. Please login again.");
         localStorage.removeItem("token");
         setTimeout(() => navigate("/login"), 2000);
      } else {
         handleStatus("error", "Failed to fetch course data.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // --- Delete Logic ---

  const deleteCourse = async (course) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the ${course.category} course "${course.name}"? This cannot be undone.`
    );
    
    if (!confirmDelete) return;

    setDeletingId(course._id);

    try {
      const token = localStorage.getItem("token");
      
      // Determine endpoint based on category
      const endpoint = course.category === 'Core' ? 'courses' : 'electives';

      await axios.delete(
        `http://localhost:5000/api/${endpoint}/${course._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setCourses(current => current.filter(c => c._id !== course._id));
      handleStatus("success", `${course.category} course deleted successfully!`);

    } catch (err) {
      console.error("Delete failed:", err);
      handleStatus("error", "Failed to delete course.");
    } finally {
      setDeletingId(null);
    }
  };

  // --- Update Logic ---

  const initiateEdit = (course) => {
    setEditingCourse({ ...course });
  };

  const handleEditChange = (e) => {
    setEditingCourse({ ...editingCourse, [e.target.name]: e.target.value });
  };

  const saveUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const token = localStorage.getItem("token");
      
      // Determine endpoint based on category
      const endpoint = editingCourse.category === 'Core' ? 'courses' : 'electives';

      const res = await axios.put(
        `http://localhost:5000/api/${endpoint}/${editingCourse._id}`,
        editingCourse,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Determine the correct object key from response
      const updatedData = res.data.course || res.data.elective || editingCourse;
      
      // Ensure we keep the category tag
      const finalUpdatedObject = { ...updatedData, category: editingCourse.category };

      setCourses(prevCourses => 
        prevCourses.map(c => c._id === editingCourse._id ? finalUpdatedObject : c)
      );

      handleStatus("success", "Course updated successfully!");
      setEditingCourse(null); 

    } catch (err) {
      console.error("Update failed:", err);
      handleStatus("error", err.response?.data?.message || "Failed to update course.");
    } finally {
      setIsUpdating(false);
    }
  };

  // --- Sub-Components ---

  const StatusMessage = ({ type, message }) => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`p-4 mb-6 rounded-lg font-medium flex items-center gap-3 shadow-sm ${
        type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
      }`}
    >
      {type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
      <span className="text-sm sm:text-base">{message}</span>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 p-4 lg:p-8 relative">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6"
        >
          <div className="flex items-center gap-4">
            <Link 
              to="/staff" 
              className="p-2.5 rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                All Courses
              </h1>
              <p className="text-gray-500 text-sm mt-1">Manage core and elective subjects</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium">
                {courses.filter(c => c.category === 'Core').length} Core
            </div>
            <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-medium">
                {courses.filter(c => c.category === 'Elective').length} Electives
            </div>
          </div>
        </motion.header>
        
        {/* ALERTS */}
        <AnimatePresence mode="wait">
          {status.type && <StatusMessage type={status.type} message={status.message} />}
        </AnimatePresence>

        {/* LOADING STATE */}
        {loading && courses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-indigo-600">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Fetching courses...</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && courses.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No courses found</h3>
            <p className="text-gray-500 mt-2 max-w-sm mx-auto">You haven't added any core or elective courses yet.</p>
          </div>
        )}

        {/* CONTENT */}
        {!loading && courses.length > 0 && (
          <>
            {/* MOBILE VIEW: Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
              {courses.map((course, index) => (
                <motion.div
                  key={course._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className={`font-bold px-2.5 py-1 rounded text-xs tracking-wide uppercase flex items-center gap-1 ${
                        course.category === 'Core' 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'bg-purple-50 text-purple-700'
                    }`}>
                      {course.acronym}
                      <span className="opacity-50">| {course.category}</span>
                    </div>
                    <div className="flex gap-2 -mr-2 -mt-2">
                        {/* Mobile Edit Button */}
                        <button 
                            onClick={() => initiateEdit(course)}
                            className="text-gray-400 hover:text-blue-600 p-1.5 rounded-full hover:bg-blue-50 transition"
                        >
                            <Edit2 size={18} />
                        </button>
                        {/* Mobile Delete Button */}
                        <button
                        onClick={() => deleteCourse(course)}
                        disabled={deletingId === course._id}
                        className="text-gray-400 hover:text-red-600 p-1.5 rounded-full hover:bg-red-50 transition"
                        >
                        {deletingId === course._id ? <Loader2 className="w-5 h-5 animate-spin text-red-500" /> : <Trash2 size={18} />}
                        </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-900 text-lg mb-1 leading-snug">{course.name}</h3>
                  <div className="text-sm text-gray-500 font-mono mb-4">{course.code}</div>

                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center text-gray-600 text-sm gap-4">
                    <div className="flex items-center gap-1.5">
                      <Layers size={16} className="text-indigo-400" />
                      <span>Year {course.year}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={16} className="text-indigo-400" />
                      <span>Sem {course.semester || 1}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* DESKTOP VIEW: Table */}
            <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                    <th className="p-4 w-16 text-center">#</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Course Details</th>
                    <th className="p-4">Code</th>
                    <th className="p-4">Year Level</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {courses.map((course, index) => (
                    <motion.tr 
                      key={course._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4 text-center text-gray-400 font-medium">{index + 1}</td>
                      
                      <td className="p-4">
                         <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                             course.category === 'Core'
                             ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                             : 'bg-purple-50 text-purple-700 border-purple-100'
                         }`}>
                             {course.category}
                         </span>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 text-base">{course.name}</span>
                          <span className="text-xs text-gray-500 mt-1">
                            {course.acronym}
                          </span>
                        </div>
                      </td>
                      
                      <td className="p-4 font-mono text-sm text-gray-600">
                        {course.code}
                      </td>
                      
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <span className="w-2 h-2 rounded-full bg-green-400"></span>
                          Year {course.year}
                        </div>
                      </td>
                      
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                            <button
                                onClick={() => initiateEdit(course)}
                                className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-all"
                                title="Edit Course"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                            onClick={() => deleteCourse(course)}
                            disabled={deletingId === course._id}
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-all"
                            title="Delete Course"
                            >
                            {deletingId === course._id ? (
                                <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                            ) : (
                                <Trash2 size={18} />
                            )}
                            </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* --- EDIT MODAL --- */}
      <AnimatePresence>
        {editingCourse && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setEditingCourse(null)}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                />
                
                {/* Modal Content */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden"
                >
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-gray-900">Edit Course</h3>
                            <span className={`text-xs px-2 py-0.5 rounded border ${
                                editingCourse.category === 'Core' 
                                ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                                : 'bg-purple-100 text-purple-700 border-purple-200'
                            }`}>
                                {editingCourse.category}
                            </span>
                        </div>
                        <button onClick={() => setEditingCourse(null)} className="p-1 rounded-full hover:bg-gray-200 text-gray-500 transition">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={saveUpdate} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Course Name</label>
                            <input 
                                type="text" 
                                name="name"
                                required
                                value={editingCourse.name} 
                                onChange={handleEditChange}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
                                <input 
                                    type="text" 
                                    name="code"
                                    required
                                    value={editingCourse.code} 
                                    onChange={handleEditChange}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Acronym</label>
                                <input 
                                    type="text" 
                                    name="acronym"
                                    required
                                    value={editingCourse.acronym} 
                                    onChange={handleEditChange}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
                            <select 
                                name="year"
                                value={editingCourse.year}
                                onChange={handleEditChange}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                            >
                                <option value="I">I</option>
                                <option value="II">II</option>
                                <option value="III">III</option>
                                <option value="IV">IV</option>
                            </select>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 mt-2">
                            <button 
                                type="button"
                                onClick={() => setEditingCourse(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                disabled={isUpdating}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}