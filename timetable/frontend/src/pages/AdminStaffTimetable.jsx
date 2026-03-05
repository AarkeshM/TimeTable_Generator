import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const StaffTimetable = () => {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Grid Configuration
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8]; 

  // --- Auth Helper ---
  const getAuthConfig = () => {
    const userInfo = localStorage.getItem("userInfo");
    const user = localStorage.getItem("user");
    const rawToken = localStorage.getItem("token");
    let token = null;

    if (userInfo) try { token = JSON.parse(userInfo).token; } catch (e) {}
    if (!token && user) try { token = JSON.parse(user).token; } catch (e) {}
    if (!token && rawToken) token = rawToken;

    return token ? { headers: { Authorization: `Bearer ${token}` } } : null;
  };

  // --- 1. Fetch Staff List ---
  useEffect(() => {
    const fetchStaff = async () => {
      const config = getAuthConfig();
      if (!config) { navigate("/login"); return; }
      try {
        const res = await axios.get("http://localhost:5000/api/faculty-timetable/staff-list", config);
        setStaffList(res.data);
      } catch (error) {
        if (error.response && error.response.status === 401) navigate("/login");
      }
    };
    fetchStaff();
  }, [navigate]);

  // --- 2. Fetch Schedule (With Debugging) ---
  const handleStaffClick = async (staff) => {
    setSelectedStaff(staff);
    setLoading(true);
    const config = getAuthConfig();
    
    if (!config) { navigate("/login"); return; }

    try {
      const res = await axios.get(
        `http://localhost:5000/api/faculty-timetable/schedule/${staff._id}`,
        config
      );
      
      // --- DEBUGGING: Check your Console (F12) to see what the DB returns ---
      console.log("RAW TIMETABLE DATA:", res.data); 
      setTimetable(res.data);

    } catch (error) {
      console.error("Error fetching timetable:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- SMART MATCHER (Fixes "Free" Issue) ---
  const getCellData = (day, period) => {
    const match = timetable.find((t) => {
      // 1. Normalize Day: "Monday" matches "MON", "Mon", or "Monday"
      // We grab the first 3 letters of both and uppercase them (e.g. "MON" === "MON")
      const dbDay = t.day ? t.day.toUpperCase().substring(0, 3) : "";
      const uiDay = day.toUpperCase().substring(0, 3);
      const isDayMatch = dbDay === uiDay;

      // 2. Normalize Period: Matches 1 (number) with "1" (string)
      // We use '==' instead of '===' to allow type coercion
      const isPeriodMatch = t.period == period;

      return isDayMatch && isPeriodMatch;
    });

    return match ? match : null;
  };

  return (
    <div className="flex h-screen bg-gray-100 p-6">
      <div className="w-1/4 bg-white shadow-xl rounded-lg overflow-hidden flex flex-col border border-gray-200">
        <div className="p-4 bg-blue-700 text-white font-bold text-lg shadow-md">Faculty List</div>
        <div className="overflow-y-auto flex-1 p-2 bg-gray-50">
          {staffList.map((staff) => (
            <div
              key={staff._id}
              onClick={() => handleStaffClick(staff)}
              className={`p-3 mb-2 rounded-md cursor-pointer transition-all border-l-4 ${
                selectedStaff?._id === staff._id
                  ? "bg-blue-50 border-blue-600 text-blue-800 font-bold shadow-sm"
                  : "border-transparent hover:bg-white text-gray-700"
              }`}
            >
              {staff.name} <span className="text-xs text-gray-400 block font-normal">{staff.department || staff.email}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 ml-6 flex flex-col bg-white shadow-xl rounded-lg border border-gray-200 overflow-hidden">
        {selectedStaff ? (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b bg-gray-50">
               <h2 className="text-2xl font-bold text-gray-800">Faculty Timetable</h2>
               <p className="text-sm text-gray-500 mt-1">Schedule for <span className="text-blue-600 font-semibold">{selectedStaff.name}</span></p>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
              ) : (
                <table className="w-full border-collapse border border-gray-300 min-w-max">
                  <thead>
                    <tr className="bg-gray-800 text-white text-xs uppercase tracking-wider">
                      <th className="border border-gray-600 p-3 text-left w-24">Day</th>
                      {periods.map((p) => <th key={p} className="border border-gray-600 p-3 text-center w-32">Period {p}</th>)}
                    </tr>
                  </thead>
                  <tbody className="text-gray-700 bg-white">
                    {days.map((day) => (
                      <tr key={day} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-3 font-bold bg-gray-100 text-gray-800 text-sm">{day}</td>
                        {periods.map((period) => {
                          const cell = getCellData(day, period);
                          return (
                            <td key={period} className="border border-gray-300 p-2 h-24 text-center align-middle relative">
                              {cell ? (
                                <div className="bg-blue-50 text-blue-900 rounded p-2 h-full flex flex-col justify-center shadow-sm border border-blue-200 hover:shadow-md">
                                  <div className="font-bold text-sm leading-tight mb-1">{cell.courseId?.name || "Course"}</div>
                                  <div className="inline-block mt-1">
                                    <span className="bg-white text-blue-700 text-xs font-bold px-2 py-0.5 rounded border border-blue-100 shadow-sm">
                                       Yr {cell.year || "?"} - {cell.section || "?"}
                                    </span>
                                  </div>
                                  {cell.room && <div className="text-[10px] text-gray-400 mt-1">Rm: {cell.room}</div>}
                                </div>
                              ) : (
                                <div className="h-full flex items-center justify-center">
                                  <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full border border-green-200 opacity-80">Free</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
            <p className="text-xl font-medium">Select a faculty member</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffTimetable;