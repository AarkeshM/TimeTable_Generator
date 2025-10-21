import { Routes, Route } from "react-router-dom";
import AuthPage from "./components/login.jsx";
import AdminDashboard from "./components/admindashboard.jsx";
import StaffDashboard from "./components/staffdashboard.jsx";  
import LandingPage from "./components/Landingpage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/staff" element={<StaffDashboard />} />
    </Routes>
  );
}
