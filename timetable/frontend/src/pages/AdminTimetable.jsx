import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft, FileSpreadsheet, BookOpen, User, Calendar, FileText, Clock
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function TimetableDisplay() {
    const navigate = useNavigate();
    const location = useLocation();

    // --- STATE ---
    const [currentData, setCurrentData] = useState(null);
    const [selectedHistoryId, setSelectedHistoryId] = useState("new");
    const [currentVersionDate, setCurrentVersionDate] = useState("Syncing...");
    const [courseDetailsMap, setCourseDetailsMap] = useState({}); 
    const [selectedYear, setSelectedYear] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCourseAndUserData(); 
        if (location.state?.timetableData) {
            loadTimetableData(location.state.timetableData, "new", new Date().toISOString());
            setIsEditing(true);
        } else {
            fetchSingleTimetable();
        }
    }, []);

    // --- HELPERS ---
    const cleanCellContent = (raw) => {
        if (!raw) return "";
        let str = String(raw);
        if (str.toUpperCase().includes('LUNCH') || str.includes('vertical-text')) return "LUNCH";
        return str.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
    };

    const formatDate = (iso) => {
        if (!iso || iso === "Loading..." || iso === "Syncing...") return "Draft Version";
        const date = new Date(iso);
        if (isNaN(date.getTime())) return "Recently Generated"; 
        return date.toLocaleDateString('en-US', { 
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true 
        });
    };

    // --- INTEGRATED API CALLS ---
    const fetchCourseAndUserData = async () => {
        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };

            // Fetching from your defined routes
            const [cRes, sRes] = await Promise.all([
                axios.get("http://localhost:5000/api/courses", { headers }).catch(() => ({ data: { courses: [] } })),
                axios.get("http://localhost:5000/api/staff", { headers }).catch(() => ({ data: [] }))
            ]);

            // Create Staff Lookup Map
            const userMap = {};
            const staffList = sRes.data.users || sRes.data || [];
            staffList.forEach(u => { if (u._id) userMap[u._id] = u.name; });

            // Create Course Detail Map (Mapping by Name and Acronym)
            const map = {};
            const courseList = cRes.data.courses || cRes.data || [];
            
            courseList.forEach(c => {
                const facultyName = (c.staffId && typeof c.staffId === 'object') 
                    ? c.staffId.name 
                    : (userMap[c.staffId] || "Unassigned");

                const details = {
                    name: c.name,
                    code: c.code || "N/A",
                    acronym: c.acronym || c.name.substring(0, 3).toUpperCase(),
                    faculty: facultyName
                };

                map[c.name.toLowerCase().trim()] = details;
                if (c.acronym) {
                    map[c.acronym.toLowerCase().trim()] = details;
                }
            });
            setCourseDetailsMap(map);
        } catch (err) {
            console.error("Sync error", err);
        }
    };

    const fetchSingleTimetable = async (id = null) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const url = id ? `http://localhost:5000/api/timetable?id=${id}` : `http://localhost:5000/api/timetable`;
            const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success && res.data.data) {
                loadTimetableData(res.data.data.timetable || res.data.data, res.data.data._id, res.data.data.createdAt);
            }
        } catch (err) {
            const MOCK = { "I": { "A": { "columns": ["Day", "09:00", "10:00", "11:00"], "data": [["MON", "MATH", "PHY", "LUNCH"]] } } };
            loadTimetableData(MOCK, "mock", new Date().toISOString());
        } finally { setLoading(false); }
    };

    const loadTimetableData = (data, id, dateStr) => {
        setCurrentData(data);
        setSelectedHistoryId(id || "new");
        setCurrentVersionDate(formatDate(dateStr));
        const years = Object.keys(data);
        if (years.length > 0) {
            setSelectedYear(years[0]);
            const sections = Object.keys(data[years[0]]);
            if (sections.length > 0) setSelectedSection(sections[0]);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post("http://localhost:5000/api/timetable", { timetable: currentData }, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) {
                setIsEditing(false);
                setCurrentVersionDate(formatDate(new Date().toISOString()));
                alert("Institutional Timetable Secured!");
            }
        } catch (err) { alert("Save failed"); } finally { setLoading(false); }
    };

    // --- EXPORT ---
    const downloadExcel = () => {
        const s = currentData[selectedYear][selectedSection];
        const ws = XLSX.utils.aoa_to_sheet([s.columns, ...s.data]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Timetable");
        XLSX.writeFile(wb, `Timetable_${selectedYear}_${selectedSection}.xlsx`);
    };

    const downloadPDF = () => {
        const doc = new jsPDF('l', 'mm', 'a4');
        const s = currentData[selectedYear][selectedSection];
        doc.text(`Year ${selectedYear} - Section ${selectedSection}`, 14, 15);
        autoTable(doc, {
            startY: 20,
            head: [s.columns],
            body: s.data.map(row => row.map(cell => cleanCellContent(cell))),
            theme: 'grid'
        });
        doc.save("Timetable.pdf");
    };

    // --- UPDATED WORKLOAD LOGIC ---
    const allocationSummary = useMemo(() => {
        if (!currentData || !selectedYear || !selectedSection) return [];
        const sheet = currentData[selectedYear]?.[selectedSection];
        if (!sheet?.data) return [];
        
        const stats = {};
        sheet.data.forEach(row => {
            row.slice(1).forEach(cell => {
                const rawName = cleanCellContent(cell);
                if (rawName && rawName !== "-" && rawName !== "LUNCH") {
                    const key = rawName.toLowerCase().trim();
                    if (!stats[key]) {
                        const d = courseDetailsMap[key];
                        stats[key] = { 
                            name: d?.name || rawName, 
                            code: d?.code || "N/A", 
                            faculty: d?.faculty || "Unassigned", 
                            count: 0 
                        };
                    }
                    stats[key].count++;
                }
            });
        });
        return Object.values(stats);
    }, [currentData, selectedYear, selectedSection, courseDetailsMap]);

    if (!currentData) return <div className="h-screen flex items-center justify-center bg-slate-50 font-black text-indigo-600 animate-pulse uppercase tracking-[0.3em]">Initializing AcadAI...</div>;

    const schedule = currentData[selectedYear]?.[selectedSection];

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20">
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/admin')} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-all border border-slate-100">
                            <ArrowLeft size={18} className="text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-lg font-black tracking-tight uppercase italic">Acad<span className="text-indigo-600">AI</span></h1>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Timetable Manager</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                            <Clock size={14} className="text-indigo-500" />
                            <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">{currentVersionDate}</span>
                        </div>
                        <button onClick={() => setIsEditing(!isEditing)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isEditing ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                            {isEditing ? 'Finish Edit' : 'Modify Slots'}
                        </button>
                        <button onClick={handleSave} disabled={loading} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 mt-8">
                <div className="bg-white p-4 rounded-[2rem] border border-slate-200 flex flex-wrap gap-6 items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-2xl">
                        {Object.keys(currentData).map(y => (
                            <button key={y} onClick={() => setSelectedYear(y)} className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${selectedYear === y ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Year {y}</button>
                        ))}
                    </div>
                    <div className="flex gap-3">
                        {currentData[selectedYear] && Object.keys(currentData[selectedYear]).map(s => (
                            <button key={s} onClick={() => setSelectedSection(s)} className={`w-11 h-11 rounded-xl flex items-center justify-center text-xs font-black border transition-all ${selectedSection === s ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border-slate-200'}`}>{s}</button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={downloadExcel} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all">
                            <FileSpreadsheet size={16} className="text-emerald-500" /> Excel
                        </button>
                        <button onClick={downloadPDF} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all">
                            <FileText size={16} className="text-rose-500" /> PDF
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 mt-8">
                <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-center border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    {schedule?.columns?.map((col, i) => (
                                        <th key={i} className={`py-6 px-4 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ${i === 0 ? 'sticky left-0 bg-white z-20 border-r border-slate-100' : ''}`}>{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {schedule?.data?.map((row, rIdx) => (
                                    <tr key={rIdx} className="hover:bg-slate-50/30 transition-colors">
                                        {row.map((cell, cIdx) => {
                                            const name = cleanCellContent(cell);
                                            return (
                                                <td key={cIdx} className={`p-0 min-w-[150px] ${cIdx === 0 ? 'sticky left-0 bg-white z-10 border-r border-slate-100 font-black text-[11px] text-slate-900 uppercase italic' : ''}`}>
                                                    {cIdx === 0 ? (
                                                        <div className="flex items-center justify-center gap-2 py-6"><Calendar size={12} className="text-indigo-500" />{cell}</div>
                                                    ) : name === "LUNCH" ? (
                                                        <div className="flex flex-col items-center justify-center py-4 text-[10px] font-black text-amber-600 bg-amber-50/30 h-full leading-none tracking-widest">
                                                            <span>L</span><span className="mt-1">U</span><span className="mt-1">N</span><span className="mt-1">C</span><span className="mt-1">H</span>
                                                        </div>
                                                    ) : isEditing ? (
                                                        <div className="p-3">
                                                            <input 
                                                                value={name}
                                                                onChange={(e) => {
                                                                    const newData = {...currentData};
                                                                    newData[selectedYear][selectedSection].data[rIdx][cIdx] = e.target.value;
                                                                    setCurrentData(newData);
                                                                }}
                                                                className="w-full px-2 py-2 text-[10px] font-bold border rounded-lg text-center outline-none focus:border-indigo-500"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center py-4 px-2">
                                                            {!name || name === "-" ? (
                                                                <div className="w-4 h-[1px] bg-slate-200" />
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-slate-700 uppercase leading-tight">
                                                                    {courseDetailsMap[name.toLowerCase()]?.acronym || name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- FACULTY WORKLOAD TABLE --- */}
            <div className="max-w-7xl mx-auto px-4 mt-8">
                <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                    <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100"><BookOpen size={18} /></div>
                            <h2 className="text-sm font-black tracking-tight uppercase">Faculty Workload Summary</h2>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                                <tr>
                                    <th className="px-8 py-5">Code</th>
                                    <th className="px-8 py-5">Course Name</th>
                                    <th className="px-8 py-5">Faculty</th>
                                    <th className="px-8 py-5 text-center">Periods</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-[12px]">
                                {allocationSummary.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5 font-black text-indigo-600">{item.code}</td>
                                        <td className="px-8 py-5 font-black text-slate-800 uppercase">{item.name}</td>
                                        <td className="px-8 py-5 flex items-center gap-3 font-bold text-slate-600">
                                            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center"><User size={14} /></div>
                                            {item.faculty}
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 bg-indigo-50 text-indigo-700 rounded-xl font-black text-xs border border-indigo-100">{item.count}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}