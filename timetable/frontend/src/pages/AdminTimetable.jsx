import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft, Save, Edit2, ChevronDown, History, CheckCircle2,
    FileText, FileSpreadsheet, Coffee, Clock, Layers
} from 'lucide-react';

// --- LIBRARIES ---
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

    const [selectedYear, setSelectedYear] = useState("");
    const [selectedSection, setSelectedSection] = useState("");
    const [activeMobileDay, setActiveMobileDay] = useState(0);

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showHistoryMenu, setShowHistoryMenu] = useState(false);
    const [showPdfMenu, setShowPdfMenu] = useState(false);

    // --- INITIALIZATION ---
    useEffect(() => {
        const init = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                // If no token, redirect to login or handle error
                console.error("No token found. Please login.");
                // navigate('/login'); // Uncomment if you want auto-redirect
                return;
            }

            // 1. Load History List from DB
            await fetchHistory();

            // 2. Load Data (Either from Generator or Fetch Latest)
            if (location.state?.timetableData) {
                // Data passed from generator page
                loadTimetableData(location.state.timetableData, "new");
            } else {
                // Fetch latest from DB
                await fetchSingleTimetable(); 
            }
        };

        init();
    }, []);

    // --- API: FETCH HISTORY LIST ---
    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:5000/api/timetable/history", { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            if (res.data.success) {
                setHistoryList(res.data.data);
            }
        } catch (err) {
            console.error("Failed to load history:", err);
        }
    };

    // --- API: FETCH SINGLE TIMETABLE ---
    const fetchSingleTimetable = async (id = null) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            
            // Build URL: if ID exists and is not 'new', fetch specific. Else fetch latest.
            let url = "http://localhost:5000/api/timetable";
            if (id && id !== 'new') {
                url += `?id=${id}`;
            }

            const res = await axios.get(url, { 
                headers: { Authorization: `Bearer ${token}` } 
            });

            if (res.data.success) {
                loadTimetableData(res.data.data, res.data.id);
            }
            setShowHistoryMenu(false);
        } catch (err) {
            console.error("Fetch Error:", err);
            // Optional: Handle 404 (Empty DB)
            if (err.response && err.response.status === 404) {
                console.log("No timetable data found on server.");
            }
        } finally {
            setLoading(false);
        }
    };

    // --- API: SAVE TIMETABLE ---
    const handleSave = async () => {
        if (!currentData) return;
        
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            
            // Send data wrapped in { timetable: ... } to match Controller
            const res = await axios.post("http://localhost:5000/api/timetable", 
                { timetable: currentData }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                alert("Timetable Saved Successfully!");
                setIsEditing(false);
                // Update local ID and refresh history list
                setSelectedHistoryId(res.data.id); 
                fetchHistory(); 
            }
        } catch (err) {
            console.error("Save Error:", err);
            alert("Failed to save. See console for details.");
        } finally {
            setLoading(false);
        }
    };

    const loadTimetableData = (data, id) => {
        setCurrentData(data);
        setSelectedHistoryId(id);
        
        // Set default Year/Section if not set
        const years = Object.keys(data);
        if (years.length > 0) {
            // Only reset selection if current selection is invalid
            if (!selectedYear || !data[selectedYear]) {
                setSelectedYear(years[0]);
                const sections = Object.keys(data[years[0]]);
                if (sections.length > 0) setSelectedSection(sections[0]);
            }
        }
    };

    // --- HELPER: DETECT LUNCH ---
    const isLunch = (val) => {
        if (!val) return false;
        const str = String(val).toLowerCase();
        return str.includes('lunch') || str.includes('break');
    };

    // --- HELPER: CLEAN DATA FOR EXPORT ---
    const cleanDataForExport = (cellData, forPdf = false) => {
        if (!cellData) return "-";
        const str = String(cellData);

        // Check for Lunch
        if (isLunch(str)) {
            return forPdf ? "[[LUNCH_ICON]]" : "LUNCH";
        }

        // Clean HTML
        let clean = str.replace(/<br\s*\/?>/gi, '\n');
        clean = clean.replace(/<[^>]*>?/gm, '');
        return clean;
    };

    // --- EXPORT FUNCTION: PDF ---
    const downloadPDF = (mode) => {
        if (!currentData) return;
        const doc = new jsPDF();
        setShowPdfMenu(false);

        const generateTableForSection = (year, section, startNewPage = false) => {
            if (startNewPage) doc.addPage();

            const schedule = currentData[year][section];
            const headers = [schedule.columns];
            const body = schedule.data.map(row => row.map(cell => cleanDataForExport(cell, true)));

            doc.setFontSize(18);
            doc.setTextColor(40);
            doc.text(`Timetable - Year ${year} Section ${section}`, 14, 22);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);

            autoTable(doc, {
                startY: 35,
                head: headers,
                body: body,
                theme: 'grid',
                headStyles: { fillColor: [79, 70, 229], textColor: 255 },
                styles: { fontSize: 9, cellPadding: 3, valign: 'middle', halign: 'center', minCellHeight: 12 },
                columnStyles: { 0: { fontStyle: 'bold', fillColor: [245, 247, 255], halign: 'left' } },
                
                didParseCell: function (data) {
                    if (data.cell.raw === "[[LUNCH_ICON]]") data.cell.text = "";
                },
                didDrawCell: function (data) {
                    if (data.cell.raw === "[[LUNCH_ICON]]") {
                        const posX = data.cell.x;
                        const posY = data.cell.y;
                        const dim = data.cell.height;
                        const centerX = posX + (data.cell.width / 2);
                        const centerY = posY + (dim / 2);

                        doc.setDrawColor(217, 119, 6);
                        doc.setLineWidth(0.5);
                        doc.roundedRect(centerX - 4, centerY - 2, 8, 6, 1, 1, 'S');
                        doc.line(centerX + 4, centerY - 1, centerX + 5.5, centerY);
                        doc.line(centerX + 5.5, centerY, centerX + 5.5, centerY + 3);
                        doc.line(centerX + 5.5, centerY + 3, centerX + 4, centerY + 4);
                        doc.line(centerX - 2, centerY - 4, centerX - 2, centerY - 2.5);
                        doc.line(centerX, centerY - 4.5, centerX, centerY - 2.5);
                        doc.line(centerX + 2, centerY - 4, centerX + 2, centerY - 2.5);
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

    // --- EXPORT FUNCTION: EXCEL ---
    const downloadExcel = () => {
        if (!currentData) return;
        const wb = XLSX.utils.book_new();

        Object.keys(currentData).forEach(year => {
            Object.keys(currentData[year]).forEach(section => {
                const schedule = currentData[year][section];
                const wsData = [
                    schedule.columns,
                    ...schedule.data.map(row => row.map(cell => cleanDataForExport(cell, false)))
                ];
                const ws = XLSX.utils.aoa_to_sheet(wsData);
                XLSX.utils.book_append_sheet(wb, ws, `${year}-${section}`.substring(0, 31));
            });
        });

        XLSX.writeFile(wb, 'timetable.xlsx');
    };

    // --- LOADING STATE ---
    if (!currentData) {
        return (
            <div className="h-screen flex flex-col items-center justify-center text-slate-400 gap-4">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
                <span>Loading Timetable...</span>
                <button onClick={() => navigate('/admin')} className="text-sm text-indigo-500 hover:underline">
                    Go Back
                </button>
            </div>
        );
    }

    const schedule = currentData[selectedYear]?.[selectedSection];
    const days = schedule?.data.map(row => row[0]) || [];

    return (
        <div className="min-h-screen bg-[#F3F4F6] text-slate-800 font-sans pb-24">

            {/* HEADER */}
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

                    {/* Version Dropdown */}
                    <div className="hidden md:block relative">
                        <button onClick={() => setShowHistoryMenu(!showHistoryMenu)} className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm font-medium">
                            <History size={14} className="text-indigo-500" />
                            <div className="flex flex-col items-start mr-2">
                                <span className="text-[10px] text-slate-400 uppercase font-bold">Version</span>
                                <span className="text-slate-700 leading-none">
                                    {selectedHistoryId === 'new' 
                                        ? 'Draft (Unsaved)' 
                                        : historyList.find(h => h._id === selectedHistoryId)?.lastUpdated 
                                            ? formatDate(historyList.find(h => h._id === selectedHistoryId).lastUpdated)
                                            : 'Current View'
                                    }
                                </span>
                            </div>
                            <ChevronDown size={14} className="text-slate-400" />
                        </button>
                        {showHistoryMenu && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 max-h-80 overflow-y-auto">
                                {historyList.length === 0 && <div className="p-3 text-sm text-slate-400 text-center">No history found</div>}
                                {historyList.map((item) => (
                                    <button key={item._id} onClick={() => fetchSingleTimetable(item._id)} className="w-full text-left p-3 rounded-xl flex items-center gap-3 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700">{formatDate(item.lastUpdated)}</span>
                                            <span className="text-[10px] text-slate-400">ID: {item._id.substring(0,8)}...</span>
                                        </div>
                                        {selectedHistoryId === item._id && <CheckCircle2 size={16} className="text-indigo-500 ml-auto"/>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsEditing(!isEditing)} className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase border bg-white text-slate-600 border-slate-200 hover:bg-slate-50">
                            <Edit2 size={14} /> {isEditing ? 'Done Editing' : 'Edit Mode'}
                        </button>
                        <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg text-sm font-bold disabled:opacity-50 transition-all">
                            {loading ? <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span> : <Save size={18} />}
                            <span className="hidden sm:inline">Save Changes</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* CONTROLS */}
            <div className="max-w-7xl mx-auto px-4 mt-6">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">

                    {/* Year/Section Selector */}
                    <div className="flex gap-4 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                        <div className="flex bg-slate-100 p-1 rounded-xl flex-shrink-0">
                            {Object.keys(currentData).map(year => (
                                <button key={year} onClick={() => { setSelectedYear(year); setSelectedSection(Object.keys(currentData[year])[0]); }}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${selectedYear === year ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                    Year {year}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {currentData[selectedYear] && Object.keys(currentData[selectedYear]).map(sec => (
                                <button key={sec} onClick={() => setSelectedSection(sec)}
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold border transition-all ${selectedSection === sec ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
                                    {sec}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* DOWNLOADS */}
                    <div className="flex gap-3 justify-end w-full md:w-auto">
                        <div className="relative">
                            <button onClick={() => setShowPdfMenu(!showPdfMenu)} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50">
                                <FileText size={16} className="text-rose-500" /> PDF <ChevronDown size={12} />
                            </button>
                            {showPdfMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-30 overflow-hidden">
                                    <button onClick={() => downloadPDF('single')} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-medium flex items-center gap-2">
                                        <FileText size={14} /> Current View
                                    </button>
                                    <button onClick={() => downloadPDF('full')} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-medium flex items-center gap-2 border-t border-slate-50">
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

            <div className="max-w-7xl mx-auto px-4 mt-6">

                {/* TABLE VIEW */}
                <div className="hidden md:block bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    {schedule?.columns.map((col, i) => (
                                        <th key={i} className={`py-4 px-6 text-xs font-bold uppercase text-slate-400 whitespace-nowrap ${i === 0 ? 'sticky left-0 bg-slate-50 z-10' : ''}`}>{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {schedule?.data.map((row, rIndex) => (
                                    <tr key={rIndex} className="group hover:bg-slate-50/50">
                                        {row.map((cell, cIndex) => {
                                            const isLunchCell = isLunch(cell);
                                            return (
                                                <td key={cIndex} className={`py-4 px-6 min-w-[140px] ${cIndex === 0 ? 'sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100' : ''}`}>
                                                    {cIndex === 0 ? (
                                                        <div className="font-bold text-slate-800">{cell}</div>
                                                    ) : isEditing ? (
                                                        <input
                                                            value={cell}
                                                            onChange={(e) => {
                                                                const newData = JSON.parse(JSON.stringify(currentData));
                                                                newData[selectedYear][selectedSection].data[rIndex][cIndex] = e.target.value;
                                                                setCurrentData(newData);
                                                            }}
                                                            className="w-full p-2 bg-white border border-indigo-200 rounded text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full">
                                                            {isLunchCell ? (
                                                                <div className="flex justify-center" title="Lunch Break">
                                                                    <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shadow-sm">
                                                                        <Coffee size={20} />
                                                                    </div>
                                                                </div>
                                                            ) : (!cell || cell === '-' || cell === '') ? (
                                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                                    Free
                                                                </span>
                                                            ) : (
                                                                <div className="text-sm font-medium text-slate-700 break-words" dangerouslySetInnerHTML={{ __html: cell }} />
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
                    </div>
                </div>

                {/* MOBILE VIEW */}
                <div className="md:hidden pb-20">
                    <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
                        {days.map((day, index) => (
                            <button key={index} onClick={() => setActiveMobileDay(index)}
                                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold ${activeMobileDay === index ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
                                {day}
                            </button>
                        ))}
                    </div>

                    <div className="relative pl-4 space-y-6">
                        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200"></div>
                        {schedule?.data[activeMobileDay]?.slice(1).map((subject, idx) => {
                            const isLunchCell = isLunch(subject);
                            return (
                                <div key={idx} className="relative pl-8">
                                    <div className={`absolute left-[11px] top-4 w-2.5 h-2.5 rounded-full ring-4 ring-white shadow-sm z-10 ${isLunchCell ? 'bg-amber-500' : 'bg-indigo-500'}`}></div>
                                    {isLunchCell ? (
                                        <div className="flex items-center justify-center p-4 rounded-2xl bg-amber-50 border border-amber-100 border-dashed text-amber-600">
                                            <Coffee size={24} />
                                        </div>
                                    ) : (
                                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-4 items-center">
                                            <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-slate-50 text-slate-500 flex-shrink-0">
                                                <Clock size={14} className="mb-0.5 opacity-50" />
                                                <span className="text-[10px] font-bold">{idx + 1}</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">{schedule.columns[idx + 1] || `Period ${idx + 1}`}</div>
                                                <div className="text-sm font-bold text-slate-800" dangerouslySetInnerHTML={{ __html: subject || 'Free Period' }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}

// --- DATE HELPER ---
const formatDate = (iso) => {
    if (!iso) return "Unknown Date";
    return new Date(iso).toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};