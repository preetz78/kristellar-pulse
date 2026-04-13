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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Improved role detection for both users and employees table
        let role = result.user?.role?.toLowerCase();

        // If role is not present but employee_id exists → it's an Employee
        if (!role && result.user?.employee_id) {
          role = "employee";
        }

        // Fallback
        if (!role) {
          role = "employee";
        }

        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));
        localStorage.setItem("role", role);
        window.dispatchEvent(new Event("auth-change"));

        // Navigate based on role
        if (role === "admin") {
          navigate("/admin/dashboard", { replace: true });
        } else if (role === "manager") {
          navigate("/manager/dashboard", { replace: true });
        } else if (role === "reviewer") {
          navigate("/reviewer/dashboard", { replace: true });
        } else if (role === "employee") {
          navigate("/employee/dashboard", { replace: true });
        } else {
          navigate("/employee/dashboard", { replace: true }); // Default fallback
        }
      } else {
        setError(result.message || "Invalid email or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to connect to server. Please make sure backend is running.");
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
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          Welcome Back
        </h2>

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
          Project Management System
        </p>
      </div>
    </div>
  );
};

export default Login;