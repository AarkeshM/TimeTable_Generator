import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Download, ArrowLeft, Clock, Calendar, Coffee, Utensils, User, Zap
} from "lucide-react";

// --- NOTE: You need to install jspdf and html2canvas for PDF functionality ---
// import jsPDF from "jspdf";
// import html2canvas from "html2canvas";

// --- Configuration ---
const FACULTY_NAME = "AARKESH M (Computer Science)";
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TOTAL_SLOTS = 10; 
// Slots: [P1, P2, BREAK, P3, P4, LUNCH, P5, P6, P7, P8]

// --- Hard-Coded Timetable Data for Dr. Evelyn Reed ---
// Content: Subject - Class (e.g., "ML - 4A")
const FACULTY_TIMETABLE_LOAD = {
    // P1       P2       BREAK  P3        P4        LUNCH  P5      P6         P7         P8
    "Monday": ["ML - 4A", "AI - 3B", "BREAK", "DS - 2C", "CN - 2C", "LUNCH", "FREE", "FREE", "FREE", "FREE"], 
    
    // Demonstrating the triple lab block in P6, P7, P8 (Slots 7, 8, 9)
    "Tuesday": ["OS - 2D", "AI - 3B", "BREAK", "FREE", "FREE", "LUNCH", "DS LAB - 2A", "DS LAB - 2A", "DS LAB - 2A","CN - 3B"],

    // Demonstrating the triple lab block in P3, P4, P5 (Slots 3, 4, 6)
    "Wednesday": ["CN - 3B", "ML LAB - 4A", "BREAK", "ML LAB - 4A", "ML LAB - 4A", "LUNCH", "FREE", "AI - 3B", "OS - 2D", "ML - 4A"],

    "Thursday": ["DS - 2C", "OS - 2D", "BREAK", "CN - 2C", "ML - 4A", "LUNCH", "FREE", "FREE", "FREE", "FREE"],
    
    "Friday": ["FREE", "FREE", "BREAK", "OS - 2D", "FREE", "LUNCH", "PROJECT - 4A", "PROJECT - 4A", "PROJECT - 4A", "FREE"],
};

export default function StaffTimetable() {
  const tableRef = useRef(null);
  
  // Helper function to determine the style of a period cell
  const getPeriodStyle = (content) => {
    const c = content.toUpperCase();
    if (c.includes("LAB") || c.includes("PROJECT")) return "bg-green-100 text-green-800 font-bold border-green-200";
    if (c.includes("LUNCH")) return "bg-red-50 text-red-700 font-bold italic border-red-200";
    if (c.includes("BREAK")) return "bg-yellow-50 text-yellow-700 font-bold italic border-yellow-200";
    if (c === "FREE") return "bg-blue-50 text-blue-600 border-blue-200";
    
    // Assigned Class (Lecture/Tutorial)
    return "bg-purple-100 text-purple-800 font-semibold border-purple-200"; 
  };

  /**
   * Placeholder function for PDF generation.
   */
  const downloadPDF = async () => {
    // NOTE: Requires 'jspdf' and 'html2canvas' to be installed and imported.
    alert(`Initiating PDF download for ${FACULTY_NAME}'s Schedule... (Requires jspdf and html2canvas libraries)`);
  };
  
  const periodSlots = [...Array(TOTAL_SLOTS)].map((_, i) => {
    if (i === 2) return { number: 'BREAK', isBreak: true };
    if (i === 5) return { number: 'LUNCH', isBreak: true };
    if (i > 2 && i < 5) return { number: i, isBreak: false };
    if (i > 5) return { number: i - 1, isBreak: false };
    return { number: i + 1, isBreak: false };
  });


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 sm:p-6 md:p-8 bg-slate-50 min-h-full"
    >
      <header className="mb-6 flex items-center justify-between border-b pb-4">
        {/* Title and Back Button container */}
        <div className="flex items-center gap-3">
          <Link
            to="/staff"
            title="Back to Dashboard"
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition flex-shrink-0"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-blue-600" />
            My Weekly Teaching Schedule
          </h1>
        </div>
      </header>

      {/* Control Panel: Faculty Name and Download */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-4 bg-white rounded-xl shadow-lg border border-slate-200"
      >
        <div className="flex items-center gap-2 text-lg font-bold text-slate-700">
           <User className="w-6 h-6 text-purple-600" /> {FACULTY_NAME}
        </div>

        {/* Download Button */}
        <button
          onClick={downloadPDF}
          className="flex items-center bg-red-600 text-white px-5 py-3 rounded-xl shadow-lg hover:bg-red-700 transition font-semibold disabled:bg-red-400 sm:w-auto w-full"
        >
          <Download className="w-5 h-5 mr-2" />
          Download My Timetable PDF
        </button>
      </motion.div>
      
      {/* Alert for Lab Rule Demo */}
       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-3 bg-yellow-100 text-yellow-800 rounded-xl flex items-center gap-3 text-sm">
            <Zap className="w-5 h-5" />
            <span className="font-medium">DEMO NOTE: This schedule showcases the mandatory break slots and the triple-period lab/project block rules on Tuesday (P5-P7) and Wednesday (P2-P4).</span>
        </motion.div>

      {/* Timetable Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="overflow-x-auto bg-white shadow-2xl rounded-xl border border-slate-200"
      >
        <div ref={tableRef} className="min-w-[1000px]">
          <table className="w-full text-sm md:text-base border-collapse">
            <thead className="bg-blue-600 text-white sticky top-0">
              <tr>
                <th className="p-4 text-left font-bold w-20">Day</th>
                {periodSlots.map((slot, i) => (
                  <th key={i} className={`p-4 text-center font-bold border-l border-blue-500/50 ${
                     slot.isBreak ? 'bg-blue-700' : ''
                  }`}>
                    {slot.number}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {DAYS.map((day, rowIndex) => (
                <tr
                  key={day}
                  className={`border-b transition duration-150 ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50`}
                >
                  <td className="p-4 font-extrabold text-blue-700 border-r border-slate-200">{day}</td>
                  {FACULTY_TIMETABLE_LOAD[day].map((content, i) => {
                    const isBreakOrLunch = content === 'BREAK' || content === 'LUNCH';
                    
                    return (
                      <td 
                        key={i} 
                        className={`p-4 text-center border-l border-slate-200 ${getPeriodStyle(content)} ${isBreakOrLunch ? 'font-bold' : ''}`}
                      >
                        {content === 'BREAK' ? <Coffee className="w-5 h-5 mx-auto text-yellow-700" title="Break" /> : 
                         content === 'LUNCH' ? <Utensils className="w-5 h-5 mx-auto text-red-700" title="Lunch" /> : content}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
      
      {/* Legend */}
      <div className="mt-6 p-4 bg-white rounded-xl shadow-lg border border-slate-200">
        <h3 className="font-bold text-lg mb-2 text-slate-700 flex items-center gap-2"><Clock className="w-5 h-5 text-blue-600" /> Legend</h3>
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
          <span className={`flex items-center p-1 rounded ${getPeriodStyle("ML - 4A")}`}>
             <span className="w-3 h-3 bg-purple-100 border border-purple-400 mr-1"></span> **[Subject - Class]**: Lecture
          </span>
          <span className={`flex items-center p-1 rounded ${getPeriodStyle("DS LAB - 2A")}`}>
            <span className="w-3 h-3 bg-green-100 border border-green-400 mr-1"></span> **LAB/PROJECT**: Practical Session
          </span>
          <span className={`flex items-center p-1 rounded ${getPeriodStyle("LUNCH")}`}>
            <Utensils className="w-4 h-4 mr-1" /> **LUNCH**: After P4
          </span>
          <span className={`flex items-center p-1 rounded ${getPeriodStyle("BREAK")}`}>
            <Coffee className="w-4 h-4 mr-1" /> **BREAK**: After P2
          </span>
          <span className={`flex items-center p-1 rounded ${getPeriodStyle("FREE")}`}>
            <span className="w-3 h-3 bg-blue-50 border border-blue-300 mr-1"></span> **FREE**: Unassigned Slot
          </span>
        </div>
      </div>
    </motion.div>
  );
}