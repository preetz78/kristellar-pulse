// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiConfig from "../config/apiConfig";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  KanbanSquare,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";

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
    <div className="relative min-h-screen overflow-hidden bg-[#07111f] text-white">
      <style>{`
        @keyframes floatPanel {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
          50% { transform: translate3d(0, -16px, 0) rotate(1deg); }
        }

        @keyframes drift {
          0% { transform: translateX(-8%) translateY(0); }
          50% { transform: translateX(8%) translateY(-10px); }
          100% { transform: translateX(-8%) translateY(0); }
        }

        @keyframes pulseLine {
          0%, 100% { opacity: .32; transform: scaleX(.86); }
          50% { opacity: .9; transform: scaleX(1); }
        }

        @keyframes taskRise {
          0% { opacity: 0; transform: translateY(18px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes shimmer {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(120%); }
        }

        .login-grid {
          background-image:
            linear-gradient(rgba(96, 165, 250, .10) 1px, transparent 1px),
            linear-gradient(90deg, rgba(96, 165, 250, .10) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(circle at center, black 0%, transparent 72%);
        }

        .task-card {
          animation: taskRise .7s ease both;
        }

        .task-card:nth-child(2) {
          animation-delay: .12s;
        }

        .task-card:nth-child(3) {
          animation-delay: .24s;
        }
      `}</style>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(59,130,246,0.34),transparent_32%),radial-gradient(circle_at_78%_24%,rgba(20,184,166,0.22),transparent_30%),linear-gradient(135deg,#06111f_0%,#10233e_48%,#07111f_100%)]" />
      <div className="login-grid absolute inset-0 opacity-80" />
      <div className="absolute -left-28 top-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute -right-24 bottom-12 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">
        <div className="grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="hidden lg:block">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl font-black text-blue-700 shadow-2xl shadow-blue-950/40">
                K
              </div>
              <div>
                <p className="text-2xl font-bold tracking-wide">KRISTELLAR</p>
                <p className="text-sm font-medium uppercase tracking-[0.3em] text-blue-200">Pulse</p>
              </div>
            </div>

            <div className="max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-blue-100 backdrop-blur">
                <Sparkles size={16} className="text-cyan-200" />
                Project work, people, and progress in one place
              </div>
              <h1 className="text-5xl font-bold leading-tight text-white">
                Keep every project moving with a clearer daily pulse.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-blue-100/80">
                Track teams, priorities, tasks, reviews, and deadlines through one focused workspace built for managers, reviewers, and employees.
              </p>
            </div>

            <div className="relative mt-12 h-[330px] max-w-2xl">
              <div
                className="absolute left-6 top-5 w-[520px] rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-2xl shadow-blue-950/40 backdrop-blur-xl"
                style={{ animation: "floatPanel 7s ease-in-out infinite" }}
              >
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-100/70">Sprint Overview</p>
                    <p className="text-xl font-semibold">Software Development</p>
                  </div>
                  <div className="rounded-2xl bg-emerald-400/15 px-4 py-2 text-sm font-semibold text-emerald-100">
                    82% Done
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: KanbanSquare, label: "Projects", value: "14" },
                    { icon: Users, label: "Members", value: "38" },
                    { icon: Clock3, label: "Due Soon", value: "06" }
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                        <Icon size={20} className="mb-3 text-cyan-200" />
                        <p className="text-2xl font-bold">{item.value}</p>
                        <p className="text-xs text-blue-100/70">{item.label}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 space-y-3">
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-4/5 origin-left rounded-full bg-gradient-to-r from-blue-400 to-cyan-300" style={{ animation: "pulseLine 3.5s ease-in-out infinite" }} />
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-2/3 origin-left rounded-full bg-gradient-to-r from-emerald-300 to-teal-300" style={{ animation: "pulseLine 4.2s ease-in-out infinite" }} />
                  </div>
                </div>
              </div>

              <div className="absolute bottom-2 left-0 w-72 space-y-3" style={{ animation: "drift 8s ease-in-out infinite" }}>
                {[
                  ["API integration", "In Review", "bg-amber-300/15 text-amber-100"],
                  ["Dashboard polish", "Active", "bg-blue-300/15 text-blue-100"],
                  ["QA checklist", "Complete", "bg-emerald-300/15 text-emerald-100"]
                ].map(([title, status, badge]) => (
                  <div key={title} className="task-card flex items-center justify-between rounded-2xl border border-white/15 bg-slate-950/45 px-4 py-3 backdrop-blur">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={18} className="text-cyan-200" />
                      <span className="text-sm font-medium">{title}</span>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge}`}>{status}</span>
                  </div>
                ))}
              </div>

              <div className="absolute bottom-10 right-16 rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl">
                <BarChart3 size={28} className="mb-3 text-cyan-200" />
                <p className="text-sm text-blue-100/70">Velocity</p>
                <p className="text-3xl font-bold">+24%</p>
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-md">
            <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl font-black text-blue-700">
                K
              </div>
              <div>
                <p className="text-xl font-bold tracking-wide">KRISTELLAR</p>
                <p className="text-xs font-medium uppercase tracking-[0.25em] text-blue-200">Pulse</p>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-[2rem] border border-white/20 bg-white/[0.12] p-8 shadow-2xl shadow-blue-950/50 backdrop-blur-2xl">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" />
              <div className="absolute -right-14 -top-14 h-36 w-36 rounded-full bg-cyan-300/20 blur-2xl transition-transform duration-700 group-hover:scale-125" />
              <div className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100">
                <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ animation: "shimmer 2.6s ease-in-out infinite" }} />
              </div>

              <div className="relative">
                <div className="mb-7 flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                      <ShieldCheck size={14} />
                      Secure workspace
                    </p>
                    <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
                    <p className="mt-2 text-sm text-blue-100/70">Sign in to continue managing your project pulse.</p>
                  </div>
                </div>

                {error && (
                  <div className="mb-5 rounded-2xl border border-red-300/30 bg-red-500/15 px-4 py-3 text-sm font-medium text-red-100">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-blue-100">Email</span>
                    <div className="relative">
                      <Mail
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-100/60"
                      />
                      <input
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleLogin();
                        }}
                        className="w-full rounded-2xl border border-white/15 bg-white/10 py-3.5 pl-12 pr-4 text-white outline-none transition-all placeholder:text-blue-100/40 hover:border-white/30 focus:border-cyan-200/80 focus:bg-white/15 focus:ring-4 focus:ring-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={loading}
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-blue-100">Password</span>
                    <div className="relative">
                      <Lock
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-100/60"
                      />
                      <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleLogin();
                        }}
                        className="w-full rounded-2xl border border-white/15 bg-white/10 py-3.5 pl-12 pr-4 text-white outline-none transition-all placeholder:text-blue-100/40 hover:border-white/30 focus:border-cyan-200/80 focus:bg-white/15 focus:ring-4 focus:ring-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={loading}
                      />
                    </div>
                  </label>
                </div>

                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-400 px-5 py-3.5 font-semibold text-white shadow-lg shadow-blue-950/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-cyan-900/40 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      Login
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                {/* <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/25 p-4">
                  <div className="flex items-center justify-between text-xs text-blue-100/70">
                    <span>Today&apos;s workspace</span>
                    <span>Live</span>
                  </div>
                  <div className="mt-3 flex items-end gap-2">
                    {[42, 62, 50, 76, 58, 86, 70].map((height, index) => (
                      <div key={index} className="flex-1 rounded-full bg-white/10">
                        <div
                          className="rounded-full bg-gradient-to-t from-blue-500 to-cyan-300"
                          style={{ height: `${height}px`, animation: `pulseLine ${3 + index * 0.18}s ease-in-out infinite` }}
                        />
                      </div>
                    ))}
                  </div>
                </div> */}

                <p className="mt-6 text-center text-sm text-blue-100/60">
                  Kristellar Pulse - Project Management System
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Login;
