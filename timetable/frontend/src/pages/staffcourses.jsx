import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, Loader2, CheckCircle, AlertTriangle, ArrowLeft, BookOpen, Layers, Calendar
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function StaffCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: null, message: "" });
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

      const res = await axios.get(
        "http://localhost:5000/api/courses/", 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCourses(res.data.courses || []);
      
    } catch (err) {
      console.error("Failed to load courses:", err);
      if (err.response?.status === 401) {
         handleStatus("error", "Session expired. Please login again.");
         localStorage.removeItem("token");
         setTimeout(() => navigate("/login"), 2000);
      } else {
         handleStatus("error", err.response?.data?.message || "Failed to fetch courses.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const deleteCourse = async (courseId, courseName) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${courseName}? This cannot be undone.`
    );
    
    if (!confirmDelete) return;

    setDeletingId(courseId);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        handleStatus("error", "Authentication token not found.");
        return;
      }

      await axios.delete(
        `http://localhost:5000/api/courses/${courseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setCourses(current => current.filter(c => c._id !== courseId));
      handleStatus("success", `Course deleted successfully!`);

    } catch (err) {
      console.error("Delete failed:", err);
      let errorMessage = "Failed to delete course.";
      if (err.response?.status === 401) {
          errorMessage = "Session expired.";
          localStorage.removeItem("token");
          setTimeout(() => navigate("/login"), 2000);
      }
      handleStatus("error", errorMessage);
      fetchCourses(); 
    } finally {
      setDeletingId(null);
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
    <div className="min-h-screen bg-gray-50 text-slate-800 p-4 lg:p-8">
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
                Course Load
              </h1>
              <p className="text-gray-500 text-sm mt-1">Manage your academic schedule</p>
            </div>
          </div>
          
          <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium self-start sm:self-center">
             {courses.length} Active {courses.length === 1 ? 'Course' : 'Courses'}
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
            <p className="text-gray-500 font-medium">Fetching your courses...</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && courses.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No courses found</h3>
            <p className="text-gray-500 mt-2 max-w-sm mx-auto">You haven't added any courses yet. Add a course to get started.</p>
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
                    <div className="bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded text-xs tracking-wide uppercase">
                      {course.acronym}
                    </div>
                    <button
                      onClick={() => deleteCourse(course._id, course.name)}
                      disabled={deletingId === course._id}
                      className="text-gray-400 hover:text-red-600 p-1.5 -mr-2 -mt-2 rounded-full hover:bg-red-50 transition"
                    >
                      {deletingId === course._id ? <Loader2 className="w-5 h-5 animate-spin text-red-500" /> : <Trash2 size={18} />}
                    </button>
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
                      <span>Semester 1</span> {/* Placeholder if sem exists */}
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
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 text-base">{course.name}</span>
                          <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full w-fit mt-1 font-medium">
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
                        <button
                          onClick={() => deleteCourse(course._id, course.name)}
                          disabled={deletingId === course._id}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-all mx-auto"
                          title="Delete Course"
                        >
                          {deletingId === course._id ? (
                            <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}