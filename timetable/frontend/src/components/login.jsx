import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Mail, Lock, User, Phone, Briefcase, UserCheck, GraduationCap, Building, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

// --- Animation Variants ---
const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeIn" } }
};

const inputContainerVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
};

// --- Google Icon Component ---
const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.244,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

// --- Auth Page Component ---
export default function AuthPage() {
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [loginAs, setLoginAs] = useState('staff'); // 'staff' or 'admin'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    department: "",
    role: "staff", // Default role for registration
    gender: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    resetMessages();

    if (isLogin) {
      try {
        // The API endpoint handles both admin and staff login based on credentials
        const { data } = await axios.post("http://localhost:5000/api/login", {
          email: formData.email,
          password: formData.password,
          loginAs: loginAs, // Informing backend of login type
        });

        setSuccess(data.message);
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        setTimeout(() => {
          if (data.user.role === "admin") {
            navigate("/admin");
          } else {
            navigate("/staff");
          }
        }, 1000);

      } catch (err) {
        setError(err.response?.data?.message || "Login failed. Please check your credentials.");
        setLoading(false);
      }
    } else { // Registration Logic
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match!");
        setLoading(false);
        return;
      }
      try {
        const { data } = await axios.post("http://localhost:5000/api/register", formData);
        setSuccess(data.message + " You can now log in.");
        setTimeout(() => {
          setIsLogin(true);
          resetMessages();
        }, 2000);
      } catch (err) {
        setError(err.response?.data?.message || "Registration failed. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
         <div className="mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
            </Link>
         </div>

        <div className="text-center mb-8">
            <a href="/" className="inline-flex items-center gap-3 text-3xl font-bold text-gray-900 tracking-tight">
                <GraduationCap className="w-9 h-9 text-blue-600" />
                AcademicSheduler
            </a>
            <p className="mt-2 text-gray-500">AI-Powered Timetable Generation</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div key="login" variants={formVariants} initial="hidden" animate="visible" exit="exit">
                <div className="mb-6">
                  <div className="flex bg-gray-100 rounded-lg p-1">
                      <button 
                          onClick={() => setLoginAs('staff')}
                          className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${loginAs === 'staff' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:bg-gray-200'}`}
                      >
                          Staff Login
                      </button>
                      <button 
                          onClick={() => setLoginAs('admin')}
                          className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-colors ${loginAs === 'admin' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:bg-gray-200'}`}
                      >
                          Admin Login
                      </button>
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-800 mb-1">Welcome Back!</h2>
                <p className="text-gray-500 mb-6 text-sm">Please enter your details to sign in.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <InputWithIcon Icon={Mail} type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email address" required />
                  <InputWithIcon Icon={Lock} type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" required />
                  
                  <div className="flex justify-end text-sm">
                    <a href="#" className="font-medium text-blue-600 hover:underline">Forgot password?</a>
                  </div>

                  <SubmitButton loading={loading} text="Sign In" />
                </form>

                <div className="my-6 flex items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="mx-4 text-xs font-semibold text-gray-400">OR</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                </div>

                <button
                    type="button"
                    className="w-full flex justify-center items-center gap-3 py-2.5 px-4 bg-white text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                    onClick={() => console.log("Continue with Google clicked")}
                >
                    <GoogleIcon />
                    Continue with Google
                </button>

              </motion.div>
            ) : (
              <motion.div key="register" variants={formVariants} initial="hidden" animate="visible" exit="exit">
                <h2 className="text-2xl font-bold text-gray-800 mb-1">Create Your Account</h2>
                <p className="text-gray-500 mb-6 text-sm">Join our platform to automate scheduling.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputWithIcon Icon={User} type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" required />
                      <InputWithIcon Icon={Phone} type="tel" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="Mobile No." required />
                  </div>
                  <InputWithIcon Icon={Building} type="text" name="department" value={formData.department} onChange={handleChange} placeholder="Department" required />
                  <div className="grid grid-cols-2 gap-4">
                    <SelectInput Icon={UserCheck} name="role" value={formData.role} onChange={handleChange} options={[{value: 'staff', label: 'Staff'}, {value: 'admin', label: 'Admin'}]} required />
                    <SelectInput Icon={UserCheck} name="gender" value={formData.gender} onChange={handleChange} options={[{value: '', label: 'Gender'},{value: 'male', label: 'Male'}, {value: 'female', label: 'Female'}, {value: 'other', label: 'Other'}]} required />
                  </div>
                  <InputWithIcon Icon={Mail} type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email address" required />
                  <InputWithIcon Icon={Lock} type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Create Password" required />
                  <InputWithIcon Icon={Lock} type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm Password" required />

                  <SubmitButton loading={loading} text="Create Account" />
                </form>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* --- MESSAGES --- */}
          <AnimatePresence>
          {error && <p className="mt-4 text-xs text-center text-red-600 bg-red-50 p-2 rounded-md">{error}</p>}
          {success && <p className="mt-4 text-xs text-center text-green-600 bg-green-50 p-2 rounded-md">{success}</p>}
          </AnimatePresence>


          <p className="text-center text-sm text-gray-500 mt-6">
            {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
            <button onClick={() => { setIsLogin(!isLogin); resetMessages(); }} className="font-semibold text-blue-600 hover:underline focus:outline-none">
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Reusable Input Components ---
const InputWithIcon = ({ Icon, ...props }) => (
    <motion.div variants={inputContainerVariants} className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="w-5 h-5 text-gray-400" />
        </div>
        <input {...props} className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition sm:text-sm" />
    </motion.div>
);

const SelectInput = ({ Icon, name, value, onChange, options, required }) => (
    <motion.div variants={inputContainerVariants} className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="w-5 h-5 text-gray-400" />
        </div>
        <select name={name} value={value} onChange={onChange} required={required} className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition sm:text-sm appearance-none bg-white">
            {options.map(opt => <option key={opt.value} value={opt.value} disabled={opt.value === ""}>{opt.label}</option>)}
        </select>
    </motion.div>
);

const SubmitButton = ({ loading, text }) => (
    <button
      type="submit"
      disabled={loading}
      className="w-full flex justify-center items-center py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:bg-blue-400"
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : text}
    </button>
);
