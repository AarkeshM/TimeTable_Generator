import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft, Save, Edit2, ChevronDown, History,
    FileText, FileSpreadsheet, Layers,
    Trash2, BookOpen, User
} from 'lucide-react';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function TimetableDisplay() {
    const navigate = useNavigate();
    const location = useLocation();

    // --- STATE ---
    const [historyList, setHistoryList] = useState([]);
    const [currentData, setCurrentData] = useState(null);
    const [selectedHistoryId, setSelectedHistoryId] = useState("new");
    const [currentVersionDate, setCurrentVersionDate] = useState("Loading...");
    
    // Stores full course details: { name, code, acronym, faculty }
    const [courseDetailsMap, setCourseDetailsMap] = useState({}); 

    const [selectedYear, setSelectedYear] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showHistoryMenu, setShowHistoryMenu] = useState(false);
    const [showPdfMenu, setShowPdfMenu] = useState(false);

    // --- INITIALIZATION ---
    useEffect(() => {
        fetchHistoryList();
        fetchCourseAndUserData(); 

        if (location.state?.timetableData) {
            // New data passed from upload/generate page
            loadTimetableData(location.state.timetableData, "new", new Date().toISOString());
            setIsEditing(true);
        } else {
            // Load latest from DB
            fetchSingleTimetable();
        }
    }, []);

    const cleanCellContent = (rawContent) => {
        if (!rawContent) return "";
        let str = String(rawContent);
        if (str.includes('<DI') || str.includes('&lt;DI')) return "LUNCH";
        str = str.replace(/<[^>]*>?/gm, ''); 
        str = str.replace(/&nbsp;/g, ' ');    
        return str.trim();
    };

    const isLunch = (val) => {
        if (!val) return false;
        const clean = cleanCellContent(val).toUpperCase();
        return clean.includes('LUNCH') || clean.includes('BREAK');
    };

    // --- API: FETCH COURSES & MAP USERS (FACULTY) ---
    const fetchCourseAndUserData = async () => {
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            // 1. Fetch Data (Handle 404s gracefully using try-catch blocks individually if needed)
            let courses = [];
            let users = [];

            try {
                const coursesRes = await axios.get("http://localhost:5000/api/courses", { headers });
                courses = coursesRes.data.courses || [];
            } catch (e) { console.warn("Courses API failed or empty"); }

            try {
                const usersRes = await axios.get("http://localhost:5000/api/staff", { headers });
                users = usersRes.data.users || usersRes.data || [];
            } catch (e) { console.warn("Users API failed (404) - Skipping user mapping"); }

            // 2. Create a User Map (ID -> Name) for fast lookup
            const userMap = {};
            if (Array.isArray(users)) {
                users.forEach(u => {
                    if (u._id) userMap[u._id] = u.name;
                });
            }

            // 3. Map Courses and Link Faculty Name
            const map = {};
            if (Array.isArray(courses)) {
                courses.forEach(course => {
                    if (course.name) {
                        const key = course.name.trim().toLowerCase();
                        
                        // Determine Faculty Name
                        let facultyName = "Unassigned";

                        if (course.staffId) {
                            if (typeof course.staffId === 'object' && course.staffId.name) {
                                facultyName = course.staffId.name;
                            } else if (userMap[course.staffId]) {
                                facultyName = userMap[course.staffId];
                            }
                        }

                        map[key] = {
                            name: course.name,
                            acronym: course.acronym || course.name.substring(0, 3).toUpperCase(),
                            code: course.code || "N/A",
                            faculty: facultyName
                        };
                    }
                });
            }

            setCourseDetailsMap(map);
        } catch (err) {
            console.warn("Could not fetch course/user context data", err);
        }
    };

    const getCourseInfo = (courseName) => {
        if (!courseName) return null;
        const cleanName = cleanCellContent(courseName).trim().toLowerCase();
        return courseDetailsMap[cleanName] || null;
    };

    const getAcronym = (courseName) => {
        const info = getCourseInfo(courseName);
        return info ? info.acronym : (cleanCellContent(courseName) || "Free");
    };

    // --- CALCULATION: SUMMARY STATISTICS (FIXED CRASH HERE) ---
    const allocationSummary = useMemo(() => {
        // 1. Basic checks
        if (!currentData || !selectedYear || !selectedSection) return [];

        // 2. Get the specific schedule
        const schedule = currentData[selectedYear]?.[selectedSection];

        // 3. CRITICAL FIX: Check if schedule AND schedule.data exist and is an array
        if (!schedule || !schedule.data || !Array.isArray(schedule.data)) {
            return [];
        }

        const stats = {};

        schedule.data.forEach(row => {
            if (!Array.isArray(row)) return; // Extra safety

            // Skip first column (Day name)
            row.slice(1).forEach(cell => {
                const cleanName = cleanCellContent(cell);
                // Filter out empty cells, lunch, or placeholders
                if (cleanName && cleanName !== "-" && cleanName !== "Free" && !isLunch(cell)) {
                    const lowerName = cleanName.trim().toLowerCase();
                    
                    if (!stats[lowerName]) {
                        // Create entry if not exists
                        const details = courseDetailsMap[lowerName];
                        stats[lowerName] = {
                            name: details ? details.name : cleanName,
                            code: details ? details.code : "-",
                            acronym: details ? details.acronym : cleanName,
                            faculty: details ? details.faculty : "External / Guest",
                            count: 0
                        };
                    }
                    stats[lowerName].count++;
                }
            });
        });

        // Convert object to array
        return Object.values(stats);
    }, [currentData, selectedYear, selectedSection, courseDetailsMap]);

    // --- API: FETCH HISTORY LIST ---
    const fetchHistoryList = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:5000/api/timetable/history", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                const sorted = res.data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setHistoryList(sorted);
            }
        } catch (err) { console.warn("Could not fetch history list"); }
    };

    // --- API: FETCH SINGLE TIMETABLE ---
    const fetchSingleTimetable = async (id = null) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const url = id ? `http://localhost:5000/api/timetable?id=${id}` : `http://localhost:5000/api/timetable`;

            const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });

            if (res.data.success && res.data.data) {
                const incomingData = res.data.data.timetable || res.data.data;
                const docId = res.data.data._id || id;
                const docDate = res.data.data.createdAt || new Date().toISOString();

                if (incomingData && Object.keys(incomingData).length > 0) {
                    loadTimetableData(incomingData, docId, docDate);
                }
            } else {
                throw new Error("No data found");
            }
        } catch (err) {
            console.warn("Loading Mock Data due to API error");
            // Basic mock data structure to prevent crashes
            const MOCK_DATA = { "1": { "A": { "columns": ["Day", "9-10"], "data": [["Mon", "Design Thinking"]] } } };
            loadTimetableData(MOCK_DATA, "mock-version", new Date().toISOString());
        } finally {
            setLoading(false);
            setShowHistoryMenu(false);
        }
    };

    const loadTimetableData = (data, id, dateStr) => {
        setCurrentData(data);
        setSelectedHistoryId(id || "new");

        if (id === 'new') setCurrentVersionDate('Unsaved Draft');
        else if (id === 'mock-version') setCurrentVersionDate('Demo Mode');
        else setCurrentVersionDate(formatDate(dateStr));

        const years = Object.keys(data);
        if (years.length > 0) {
            setSelectedYear(years[0]);
            const sections = Object.keys(data[years[0]]);
            if (sections.length > 0) setSelectedSection(sections[0]);
        }
    };

    // --- API: SAVE ---
    const handleSave = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post("http://localhost:5000/api/timetable",
                { timetable: currentData },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                await fetchHistoryList();
                setSelectedHistoryId(res.data.data._id);
                setCurrentVersionDate(formatDate(res.data.data.createdAt));
                setIsEditing(false);
                alert("Timetable Saved Successfully!");
            }
        } catch (err) { alert("Failed to save."); }
        finally { setLoading(false); }
    };

    // --- API: DELETE ---
    const handleDelete = async (id, e = null) => {
        if (e) e.stopPropagation();
        if (!id || id === 'new' || id === 'mock-version') return;
        if (!window.confirm("Delete this version permanently?")) return;

        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://localhost:5000/api/timetable?id=${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistoryList(prev => prev.filter(item => item._id !== id));
            if (selectedHistoryId === id) {
                setTimeout(() => fetchSingleTimetable(), 500);
            }
            alert("Deleted.");
        } catch (err) { alert("Failed to delete."); }
        finally { setLoading(false); }
    };

    // --- EXPORTS ---
    const downloadPDF = (mode) => {
        if (!currentData) return;
        const doc = new jsPDF();
        setShowPdfMenu(false);

        const generateTableForSection = (year, section, startNewPage = false) => {
            const schedule = currentData[year]?.[section];
            // Safety check for export
            if (!schedule || !schedule.data) return;

            if (startNewPage) doc.addPage();

            const headers = [schedule.columns];
            const body = schedule.data.map(row => row.map((cell, i) => {
                if (i === 0) return cell;
                if (isLunch(cell)) return "[[LUNCH_ICON]]";
                return getAcronym(cell);
            }));

            doc.setFontSize(14);
            doc.text(`Timetable - Year ${year} Section ${section}`, 14, 20);

            autoTable(doc, {
                startY: 25,
                head: headers,
                body: body,
                theme: 'grid',
                headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 8 },
                styles: { fontSize: 8, valign: 'middle', halign: 'center', cellPadding: 2 },
                columnStyles: { 0: { fontStyle: 'bold', fillColor: [245, 247, 255], halign: 'left' } },
                didParseCell: function (data) {
                    if (data.cell.raw === "[[LUNCH_ICON]]") data.cell.text = "";
                },
                didDrawCell: function (data) {
                    if (data.cell.raw === "[[LUNCH_ICON]]") {
                        doc.setFillColor(255, 247, 237);
                        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                        doc.setFontSize(6);
                        doc.text("BREAK", data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2, { align: 'center', baseline: 'middle' });
                    }
                }
            });
        };

        if (mode === 'single') {
            generateTableForSection(selectedYear, selectedSection);
            doc.save(`timetable_${selectedYear}_${selectedSection}.pdf`);
        } else {
            let isFirst = true;
            Object.keys(currentData).forEach(year => {
                Object.keys(currentData[year]).forEach(section => {
                    generateTableForSection(year, section, !isFirst);
                    isFirst = false;
                });
            });
            doc.save('full_timetable.pdf');
        }
    };

    const downloadExcel = () => {
        if (!currentData) return;
        const wb = XLSX.utils.book_new();
        Object.keys(currentData).forEach(year => {
            Object.keys(currentData[year]).forEach(section => {
                const schedule = currentData[year][section];
                if(schedule && schedule.data) {
                    const wsData = [schedule.columns, ...schedule.data.map(row => row.map((cell, i) => {
                        if (i === 0) return cell;
                        if (isLunch(cell)) return "LUNCH";
                        return getAcronym(cell);
                    }))];
                    const ws = XLSX.utils.aoa_to_sheet(wsData);
                    XLSX.utils.book_append_sheet(wb, ws, `${year}-${section}`.substring(0, 31));
                }
            });
        });
        XLSX.writeFile(wb, 'timetable.xlsx');
    };

    const formatDate = (iso) => {
        if (!iso) return "Unknown Date";
        return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // --- LOADING STATE ---
    if (!currentData) return <div className="h-screen flex items-center justify-center text-slate-400">Loading Timetable...</div>;

    const schedule = currentData[selectedYear]?.[selectedSection];
    
    return (
        <div className="min-h-screen bg-[#F3F4F6] text-slate-800 font-sans pb-24">
            
            {/* --- HEADER --- */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/admin')} className="p-2 rounded-xl hover:bg-slate-100 transition-all">
                            <ArrowLeft size={20} className="text-slate-500" />
                        </button>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-slate-800 leading-none">Timetable</h1>
                            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 mt-1 uppercase">
                                {selectedYear} • {selectedSection}
                            </div>
                        </div>
                    </div>

                    {/* HISTORY DROPDOWN */}
                    <div className="hidden md:block relative">
                        <button onClick={() => setShowHistoryMenu(!showHistoryMenu)} className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium hover:bg-slate-100 transition-colors">
                            <History size={14} className="text-indigo-500" />
                            <div className="flex flex-col items-start mr-2">
                                <span className="text-[10px] text-slate-400 uppercase font-bold">Version</span>
                                <span className="text-slate-700 leading-none whitespace-nowrap">
                                    {currentVersionDate}
                                </span>
                            </div>
                            <ChevronDown size={14} className="text-slate-400" />
                        </button>
                        {showHistoryMenu && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50">
                                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                    {historyList.length === 0 ? (
                                        <div className="p-4 text-center text-xs text-slate-400">No history found</div>
                                    ) : (
                                        historyList.map((item) => (
                                            <div key={item._id} className="flex items-center gap-1 group rounded-xl hover:bg-slate-50 transition-colors p-1">
                                                <button onClick={() => fetchSingleTimetable(item._id)} className="flex-1 text-left p-2 flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${selectedHistoryId === item._id ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                                                    <div className="flex flex-col">
                                                        <span className={`text-sm font-bold ${selectedHistoryId === item._id ? 'text-indigo-700' : 'text-slate-700'}`}>
                                                            {formatDate(item.createdAt)}
                                                        </span>
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(item._id, e)}
                                                    className="p-2 mr-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex items-center gap-2">
                        {selectedHistoryId !== 'new' && selectedHistoryId !== 'mock-version' && (
                            <button
                                onClick={() => handleDelete(selectedHistoryId)}
                                disabled={loading}
                                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase border border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                        <button onClick={() => setIsEditing(!isEditing)} className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase border transition-all ${isEditing ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white text-slate-600 border-slate-200'}`}>
                            <Edit2 size={14} /> {isEditing ? 'Editing...' : 'Edit'}
                        </button>
                        <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white rounded-xl shadow-lg shadow-indigo-200 text-sm font-bold transition-all active:scale-95">
                            {loading ? 'Saving...' : <><Save size={18} /> <span className="hidden sm:inline">Save</span></>}
                        </button>
                    </div>
                </div>
            </header>

            {/* --- CONTROLS --- */}
            <div className="max-w-7xl mx-auto px-4 mt-6">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex gap-4 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            {Object.keys(currentData).map(year => (
                                <button key={year} onClick={() => { setSelectedYear(year); setSelectedSection(Object.keys(currentData[year])[0]); }}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${selectedYear === year ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                    Year {year}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            {currentData[selectedYear] && Object.keys(currentData[selectedYear]).map(sec => (
                                <button key={sec} onClick={() => setSelectedSection(sec)}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border transition-all ${selectedSection === sec ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
                                    {sec}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3 justify-end w-full md:w-auto">
                        <div className="relative">
                            <button onClick={() => setShowPdfMenu(!showPdfMenu)} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50">
                                <FileText size={16} className="text-rose-500" /> PDF <ChevronDown size={12} />
                            </button>
                            {showPdfMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-30 overflow-hidden">
                                    <button onClick={() => downloadPDF('single')} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-medium flex items-center gap-2 text-slate-700">
                                        <FileText size={14} /> Current View
                                    </button>
                                    <button onClick={() => downloadPDF('full')} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-medium flex items-center gap-2 border-t border-slate-50 text-slate-700">
                                        <Layers size={14} /> Entire Timetable
                                    </button>
                                </div>
                            )}
                        </div>
                        <button onClick={downloadExcel} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50">
                            <FileSpreadsheet size={16} className="text-emerald-500" /> Excel
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 mt-6 space-y-6">
                
                {/* --- 1. COMPACT DESKTOP TABLE VIEW --- */}
                <div className="hidden md:block bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    {schedule?.columns?.map((col, i) => (
                                        <th key={i} className={`py-3 px-3 text-[11px] font-bold uppercase text-slate-500 whitespace-nowrap text-center ${i === 0 ? 'sticky left-0 bg-slate-50 z-10 border-r border-slate-100 text-left pl-6' : ''}`}>{col}</th>
                                    )) || <th className="p-4 text-xs">No columns defined</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {schedule?.data?.map((row, rIndex) => (
                                    <tr key={rIndex} className="group hover:bg-slate-50/50 transition-colors">
                                        {row.map((cell, cIndex) => {
                                            const isLunchCell = isLunch(cell);
                                            return (
                                                <td key={cIndex} className={`py-2 px-2 min-w-[100px] text-center ${cIndex === 0 ? 'sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100 text-left pl-6 w-24' : ''}`}>
                                                    {cIndex === 0 ? (
                                                        <div className="font-bold text-xs text-slate-800 uppercase">{cell}</div>
                                                    ) : isEditing ? (
                                                        <input
                                                            value={cleanCellContent(cell)}
                                                            onChange={(e) => {
                                                                const newData = JSON.parse(JSON.stringify(currentData));
                                                                if(newData[selectedYear][selectedSection].data) {
                                                                    newData[selectedYear][selectedSection].data[rIndex][cIndex] = e.target.value;
                                                                    setCurrentData(newData);
                                                                }
                                                            }}
                                                            className="w-full p-1.5 text-xs bg-white border border-indigo-200 rounded text-center outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center">
                                                            {isLunchCell ? (
                                                                <div className="w-full h-8 rounded bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 text-[10px] font-bold tracking-widest uppercase">
                                                                    Break
                                                                </div>
                                                            ) : (!cleanCellContent(cell) || cleanCellContent(cell) === '-' || cleanCellContent(cell) === 'Free') ? (
                                                                <span className="text-slate-300 text-xs">-</span>
                                                            ) : (
                                                                <div className="w-full">
                                                                    <div className="text-xs font-bold text-slate-700" title={cleanCellContent(cell)}>
                                                                        {getAcronym(cell)}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {(!schedule || !schedule.data) && (
                            <div className="p-10 text-center text-slate-400 text-sm">No schedule data available for this section.</div>
                        )}
                    </div>
                </div>

                {/* --- 2. FACULTY & COURSE ALLOCATION SUMMARY --- */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <BookOpen size={16} className="text-indigo-500" />
                            Course Allocation & Faculty Details
                        </h2>
                        <span className="text-xs text-slate-400 font-medium">Summary for {selectedYear} - {selectedSection}</span>
                    </div>
                    
                    {allocationSummary.length === 0 ? (
                        <div className="p-8 text-center text-sm text-slate-400">No courses allocated yet.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-100">
                                        <th className="px-6 py-3">Course Code</th>
                                        <th className="px-6 py-3">Course Name</th>
                                        <th className="px-6 py-3 text-center">Acronym</th>
                                        <th className="px-6 py-3">Faculty Name</th>
                                        <th className="px-6 py-3 text-center">Periods</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-sm text-slate-600">
                                    {allocationSummary.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-3 font-mono text-xs text-slate-500">{item.code}</td>
                                            <td className="px-6 py-3 font-medium text-slate-800">{item.name}</td>
                                            <td className="px-6 py-3 text-center">
                                                <span className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                                                    {item.acronym}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                                        <User size={12} className="text-slate-400" />
                                                    </div>
                                                    <span className="text-slate-700 text-xs font-medium">
                                                        {item.faculty || "Unassigned"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                                    {item.count}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}