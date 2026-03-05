import { Routes, Route } from "react-router-dom";
import AuthPage from "./components/login.jsx";
import AdminDashboard from "./components/admindashboard.jsx";
import StaffDashboard from "./components/staffdashboard.jsx";  
import LandingPage from "./components/Landingpage.jsx";
import StaffTimetable from "./pages/stafftimetable.jsx";
import StaffCourses from "./pages/staffcourses.jsx";
import StaffProfile from "./pages/staffprofile.jsx";
import StaffManagement from "./pages/StaffManagement.jsx";
import TimetableManagement from "./pages/AdminTimetable.jsx";
import AdminSettings from "./pages/AdminSettingPage.jsx";
import Contact from "./components/Contact.jsx";
import TimetablePage from "./pages/TimetablePage.jsx";
import AdminStaffTimetable from "./pages/AdminStaffTimetable.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/staff" element={<StaffDashboard />} />
      <Route path="/staff/timetable" element={<StaffTimetable />} />
      <Route path="/staff/courses" element={<StaffCourses />} />
      <Route path="/staff/profile" element={<StaffProfile />} />
      <Route path="/admin/staff-management" element={<StaffManagement />} />
      <Route path="/admin/timetable" element={<TimetableManagement />} /> 
      <Route path="/admin/settings" element={<AdminSettings />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/admin/timetable" element={<TimetablePage />} />
      <Route path="/admin/staff-timetable" element={<AdminStaffTimetable />} />
    </Routes>
  );
}
