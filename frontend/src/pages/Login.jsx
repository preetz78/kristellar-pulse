import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { users } from "../data/users";
import { Mail, Lock } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    const user = users.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      setError("Invalid email or password ❌");
      return;
    }

    setError("");

    // Save role and trigger update
    localStorage.setItem("role", user.role);
    window.dispatchEvent(new Event("auth-change"));

    // Navigate based on role
    if (user.role === "admin") {
      navigate("/admin/dashboard", { replace: true });
    } else if (user.role === "manager") {
      navigate("/manager/dashboard", { replace: true });
    } else if (user.role === "reviewer") {
      navigate("/reviewer/dashboard", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="h-screen flex items-center justify-center relative overflow-hidden">

      {/* Background Image */}
      <img
        src="/bg.jpg"
        alt="background"
        className="absolute w-full h-full object-cover scale-110"
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Glass Card */}
      <div className="relative w-[360px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8">

        {/* Title */}
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          Welcome Back 👋
        </h2>

        {/* Error Message */}
        {error && (
          <div className="mb-4 text-sm text-red-300 text-center">
            {error}
          </div>
        )}

        {/* Email */}
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
          />
        </div>

        {/* Password */}
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
          />
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full py-3 rounded-xl bg-white text-blue-600 font-semibold hover:bg-blue-100 transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-md"
        >
          Login
        </button>

        {/* Footer */}
        <p className="text-center text-white/60 text-sm mt-6">
          Project Management System
        </p>
      </div>
    </div>
  );
};

export default Login;