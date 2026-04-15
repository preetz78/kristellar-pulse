// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiConfig from "../config/apiConfig";
import { Mail, Lock } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${apiConfig.API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const userData = result.user;
        let role = (userData.role || "").toLowerCase();

        // Handle employee role fallback
        if (!role && userData.employee_id) role = "employee";

        // Save to sessionStorage
        sessionStorage.setItem("token", result.token);
        sessionStorage.setItem("user", JSON.stringify(userData));
        sessionStorage.setItem("role", role);

        // Notify App.jsx
        window.dispatchEvent(new Event("auth-change"));

        // Redirect based on role
        if (role === "admin") navigate("/admin/dashboard", { replace: true });
        else if (role === "manager") navigate("/manager/dashboard", { replace: true });
        else if (role === "reviewer") navigate("/reviewer/dashboard", { replace: true });
        else navigate("/employee/dashboard", { replace: true });
      } else {
        setError(result.message || "Invalid email or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Cannot connect to server. Is backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center relative overflow-hidden">
      <img 
        src="/bg.jpg" 
        alt="background" 
        className="absolute w-full h-full object-cover scale-110" 
      />
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative w-[360px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8">
        <h2 className="text-2xl font-bold text-white text-center mb-6">Welcome Back</h2>

        {error && <div className="mb-4 text-sm text-red-300 text-center">{error}</div>}

        <div className="relative mb-4">
          <Mail
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40 transition"
            disabled={loading}
          />
        </div>

        <div className="relative mb-5">
          <Lock
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/60 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40 transition"
            disabled={loading}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-white text-blue-600 font-semibold hover:bg-blue-100 transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-center text-white/60 text-sm mt-6">
          Kristellar Pulse - Project Management System
        </p>
      </div>
    </div>
  );
};

export default Login;