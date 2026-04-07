import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  GraduationCap,
  BookOpen,
  Users,
  Crown,
  ChevronLeft,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import axios from 'axios';

type Role = 'STUDENT' | 'PROFESSOR' | 'HOD' | 'PRINCIPAL';

const ROLES: {
  role: Role;
  label: string;
  icon: React.ReactNode;
  accent: string;
  surface: string;
  helper: string;
}[] = [
  {
    role: 'STUDENT',
    label: 'Student',
    icon: <GraduationCap size={20} />,
    accent: 'text-sky-700',
    surface: 'from-sky-500/20 via-white to-sky-100',
    helper: 'Request leave, track status, and manage supporting documents.',
  },
  {
    role: 'PROFESSOR',
    label: 'Professor',
    icon: <BookOpen size={20} />,
    accent: 'text-emerald-700',
    surface: 'from-emerald-500/20 via-white to-emerald-100',
    helper: 'Review student requests and keep department schedules balanced.',
  },
  {
    role: 'HOD',
    label: 'HOD',
    icon: <Users size={20} />,
    accent: 'text-amber-700',
    surface: 'from-amber-500/20 via-white to-amber-100',
    helper: 'Oversee faculty approvals and enforce department-level policy.',
  },
  {
    role: 'PRINCIPAL',
    label: 'Principal',
    icon: <Crown size={20} />,
    accent: 'text-rose-700',
    surface: 'from-rose-500/20 via-white to-rose-100',
    helper: 'Approve escalated requests with institution-wide visibility.',
  },
];

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const activeRole = ROLES.find(({ role }) => role === selectedRole) ?? null;

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMsg('');
    try {
      await axios.post('/api/auth/reset-password', { email: resetEmail, newPassword: resetNewPassword });
      setResetMsg('Password reset successfully! You can now login.');
      setTimeout(() => { setShowReset(false); setResetMsg(''); setResetEmail(''); setResetNewPassword(''); }, 2500);
    } catch (err: any) {
      setResetMsg(err.response?.data?.message || 'Reset failed. Check your email.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRole) {
      setErrorMsg('Select a role to continue.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password,
        role: selectedRole,
      });

      if (response.data.success) {
        const { user } = response.data.data;
        login(user);
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setErrorMsg('');
  };

  const resetRoleSelection = () => {
    setSelectedRole(null);
    setEmail('');
    setPassword('');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#eff6ff_0%,#f8fafc_42%,#e2e8f0_100%)] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-5xl mb-8 px-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-500 hover:text-gray-900 transition-colors mb-6 mx-auto sm:mx-0"
        >
          <ChevronLeft size={16} className="mr-1" /> Back to Home
        </button>

        <div className="flex justify-center sm:justify-start mb-6">
          <div className="w-12 h-12 bg-primary-600 rounded-lg shadow-sm flex items-center justify-center text-white">
            <Layers size={24} />
          </div>
        </div>

        <div className="max-w-2xl">
          <h2 className="mt-2 text-4xl font-black text-brand-900 tracking-tight text-center sm:text-left">
            Secure role-based access for every approval stage
          </h2>
          <p className="mt-3 text-center sm:text-left text-base text-brand-700">
            Choose your institutional role first, then continue with credentials scoped to that access level.
          </p>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-5xl px-4">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.9fr]">
          <section className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
            <div className="flex items-center justify-between gap-4 mb-8">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-500">Step 1</p>
                <h3 className="mt-2 text-2xl font-bold text-brand-900">Choose your role</h3>
              </div>
              <div className="hidden sm:flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-600">
                <ShieldCheck size={16} />
                Access scoped by role
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {ROLES.map(({ role, label, icon, accent, surface, helper }) => {
                const isActive = selectedRole === role;

                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleSelect(role)}
                    className={`rounded-3xl border p-5 text-left transition-all duration-200 ${
                      isActive
                        ? 'border-brand-900 bg-brand-900 text-white shadow-xl shadow-brand-900/15'
                        : 'border-slate-200 bg-gradient-to-br hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg'
                    } ${!isActive ? surface : ''}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isActive ? 'bg-white/15 text-white' : `bg-white ${accent}`}`}>
                        {icon}
                      </div>
                      <span className={`text-xs font-semibold uppercase tracking-[0.2em] ${isActive ? 'text-white/70' : 'text-brand-500'}`}>
                        Portal
                      </span>
                    </div>

                    <h4 className={`mt-6 text-xl font-bold ${isActive ? 'text-white' : 'text-brand-900'}`}>{label}</h4>
                    <p className={`mt-2 text-sm leading-6 ${isActive ? 'text-white/78' : 'text-brand-700'}`}>{helper}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[28px] border border-brand-100 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8">
            {!activeRole ? (
              <div className="flex h-full min-h-[420px] flex-col justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-500">Step 2</p>
                  <h3 className="mt-2 text-2xl font-bold text-brand-900">Sign in to continue</h3>
                  <p className="mt-3 text-sm leading-6 text-brand-700">
                    Pick a role on the left to open the correct authentication form. This prevents cross-role sign-ins even when an email exists in the system.
                  </p>
                </div>

                <div className="rounded-3xl border border-dashed border-brand-200 bg-brand-50/70 p-6">
                  <p className="text-sm font-semibold text-brand-800">Why this flow matters</p>
                  <p className="mt-2 text-sm leading-6 text-brand-600">
                    Role-first authentication keeps approval permissions aligned with institutional hierarchy and makes the login experience clearer for students, faculty, and administrators.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4 mb-8">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-500">Step 2</p>
                    <h3 className="mt-2 text-2xl font-bold text-brand-900">Login as {activeRole.label}</h3>
                    <p className="mt-2 text-sm text-brand-700">
                      Credentials are verified against the selected role before access is granted.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={resetRoleSelection}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-brand-700 transition-colors hover:border-slate-300 hover:text-brand-900"
                  >
                    <ArrowLeft size={16} />
                    Change role
                  </button>
                </div>

                <div className="mb-6 flex items-center gap-3 rounded-2xl bg-brand-50 px-4 py-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-white ${activeRole.accent}`}>
                    {activeRole.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">Selected access</p>
                    <p className="text-sm font-semibold text-brand-900">{activeRole.label} dashboard</p>
                  </div>
                </div>

                <form className="space-y-5" onSubmit={handleLogin}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {selectedRole === 'STUDENT' ? 'College Email ID' : 'Institutional Email'}
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      placeholder={selectedRole === 'STUDENT' ? 'student@sece.ac.in' : 'name@sece.ac.in'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field"
                      placeholder={selectedRole === 'STUDENT' ? 'Enter your student password' : 'Enter your secure password'}
                    />

                  </div>

                  {errorMsg && (
                    <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full text-base py-3 ${isLoading ? 'bg-gray-400 cursor-not-allowed text-white rounded-lg' : 'btn-primary'}`}
                  >
                    {isLoading ? 'Logging in...' : `Login as ${activeRole.label}`}
                  </button>

                  <p className="text-center text-sm text-brand-600">
                    <button type="button" onClick={() => setShowReset(true)} className="font-semibold text-brand-900 hover:underline">
                      Forgot Password?
                    </button>
                  </p>
                </form>

                <p className="mt-6 text-center text-sm text-brand-600">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => navigate('/register')} className="font-semibold text-brand-900 hover:underline">
                    Register
                  </button>
                </p>
              </>
            )}
          </section>
        </div>
      </div>

      {/* Reset Password Modal */}
      {showReset && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Reset Password</h3>
            <p className="text-sm text-gray-500 mb-4">Enter your registered email and set a new password.</p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" required className="input-field" placeholder="your@email.com"
                  value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" required minLength={6} className="input-field" placeholder="Enter new password"
                  value={resetNewPassword} onChange={(e) => setResetNewPassword(e.target.value)} />
              </div>
              {resetMsg && (
                <p className={`text-sm font-medium ${resetMsg.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                  {resetMsg}
                </p>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowReset(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={resetLoading}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold text-white ${resetLoading ? 'bg-gray-400' : 'bg-brand-900 hover:bg-brand-800'}`}>
                  {resetLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
