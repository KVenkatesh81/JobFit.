import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f13] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-800 tracking-tight">
            <span className="text-white">Job</span>
            <span className="text-indigo-400">Fit</span>
            <span className="text-white">.ai</span>
          </h1>
          <p className="text-slate-500 text-sm mt-2">Your AI-powered career copilot</p>
        </div>

        <form onSubmit={submit} className="bg-[#17171f] border border-white/5 rounded-2xl p-8 space-y-5 shadow-2xl">
          <h2 className="font-display text-xl font-semibold text-white">Create account</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs text-slate-400 uppercase tracking-widest">Full Name</label>
            <input
              type="text" name="name" value={form.name} onChange={handle} required
              className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-colors placeholder-slate-600"
              placeholder="Arjun Sharma"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 uppercase tracking-widest">Email</label>
            <input
              type="email" name="email" value={form.email} onChange={handle} required
              className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-colors placeholder-slate-600"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 uppercase tracking-widest">Password</label>
            <input
              type="password" name="password" value={form.password} onChange={handle} required
              className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-colors placeholder-slate-600"
              placeholder="Min 6 characters"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors font-display tracking-wide"
          >
            {loading ? 'Creating account...' : 'Get Started'}
          </button>

          <p className="text-center text-sm text-slate-500">
            Have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
