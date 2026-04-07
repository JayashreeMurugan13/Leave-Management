import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ChevronLeft } from 'lucide-react';
import axios from 'axios';

type Role = 'STUDENT' | 'PROFESSOR' | 'HOD' | 'PRINCIPAL';

const DEPARTMENTS = ['AIML', 'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'ADMIN'];

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT' as Role,
    department: 'AIML',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      await axios.post('/api/auth/register', form);
      navigate('/login');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Registration failed. Try again.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#eff6ff_0%,#f8fafc_42%,#e2e8f0_100%)] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-500 hover:text-gray-900 transition-colors mb-6"
        >
          <ChevronLeft size={16} className="mr-1" /> Back to Home
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center text-white">
            <Layers size={20} />
          </div>
          <h2 className="text-2xl font-black text-brand-900">Create Account</h2>
        </div>

        <div className="rounded-[28px] border border-white/70 bg-white/85 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                className="input-field"
                placeholder="yourname@sece.ac.in"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={form.password}
                onChange={handleChange}
                className="input-field"
                placeholder="Create a password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select name="role" value={form.role} onChange={handleChange} className="input-field">
                <option value="STUDENT">Student</option>
                <option value="PROFESSOR">Professor</option>
                <option value="HOD">HOD</option>
                <option value="PRINCIPAL">Principal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select name="department" value={form.department} onChange={handleChange} className="input-field">
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {errorMsg && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {errorMsg}
                {errorMsg.toLowerCase().includes('already') && (
                  <span> <button type="button" onClick={() => navigate('/login')} className="underline font-semibold">Login instead?</button></span>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full text-base py-3 ${isLoading ? 'bg-gray-400 cursor-not-allowed text-white rounded-lg' : 'btn-primary'}`}
            >
              {isLoading ? 'Registering...' : 'Register'}
            </button>

            <p className="text-center text-sm text-brand-600">
              Already have an account?{' '}
              <button type="button" onClick={() => navigate('/login')} className="font-semibold text-brand-900 hover:underline">
                Login
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
