import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (email, password) => setForm({ email, password });

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {/* <div className="w-14 h-14 rounded-2xl bg-primary-500 flex items-center justify-center text-3xl mx-auto mb-4">🏨</div> */}
          <h1 className="text-2xl font-semibold text-slate-100">Hostel</h1>
          <p className="text-sm text-slate-500 mt-1">Hostel Management System</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="admin@hostel.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center py-2.5"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '→'}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <div className="mt-4 card">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Demo accounts</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Admin', email: 'admin@hostel.com', pass: 'Admin@123', color: 'text-primary-400' },
              { label: 'Staff', email: 'ravi@hostel.com', pass: 'Staff@123', color: 'text-teal-400' },
              { label: 'Resident', email: 'arjun@email.com', pass: 'Resident@123', color: 'text-amber-400' },
            ].map(a => (
              <button
                key={a.label}
                type="button"
                onClick={() => quickLogin(a.email, a.pass)}
                className="btn btn-secondary text-xs py-1.5 justify-center"
              >
                <span className={a.color}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
