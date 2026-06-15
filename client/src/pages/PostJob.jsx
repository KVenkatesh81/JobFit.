import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function PostJob() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', company: '', location: '', type: 'Remote',
    salary: '', skills: '', description: '', applyLink: '', deadline: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/jobs', {
        ...form,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      });
      navigate('/jobs');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f13]">
      <nav className="border-b border-white/5 bg-[#0f0f13]/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="font-display text-2xl font-bold">
            <span className="text-white">Job</span><span className="text-indigo-400">Fit</span><span className="text-white">.ai</span>
          </button>
          <button onClick={() => navigate('/jobs')}
            className="text-sm text-slate-400 hover:text-white border border-white/10 px-4 py-1.5 rounded-lg transition-all">
            ← Job Board
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h2 className="font-display text-3xl font-bold text-white mb-2">Post a Job</h2>
        <p className="text-slate-400 mb-8">Share an opportunity with the community</p>

        <form onSubmit={submit} className="bg-[#17171f] border border-white/5 rounded-2xl p-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 uppercase tracking-widest">Job Title *</label>
              <input name="title" value={form.title} onChange={handle} required
                placeholder="e.g. Frontend Engineer"
                className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 placeholder-slate-600" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 uppercase tracking-widest">Company *</label>
              <input name="company" value={form.company} onChange={handle} required
                placeholder="e.g. Google"
                className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 placeholder-slate-600" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 uppercase tracking-widest">Location *</label>
              <input name="location" value={form.location} onChange={handle} required
                placeholder="e.g. Bangalore / Anywhere"
                className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 placeholder-slate-600" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 uppercase tracking-widest">Type</label>
              <select name="type" value={form.type} onChange={handle}
                className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500">
                <option>Remote</option>
                <option>Onsite</option>
                <option>Hybrid</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 uppercase tracking-widest">Salary</label>
              <input name="salary" value={form.salary} onChange={handle}
                placeholder="e.g. ₹8-12 LPA"
                className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 placeholder-slate-600" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 uppercase tracking-widest">Required Skills</label>
            <input name="skills" value={form.skills} onChange={handle}
              placeholder="e.g. React, Node.js, MongoDB (comma separated)"
              className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 placeholder-slate-600" />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 uppercase tracking-widest">Job Description *</label>
            <textarea name="description" value={form.description} onChange={handle} required rows={5}
              placeholder="Describe the role, responsibilities, requirements..."
              className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 resize-none placeholder-slate-600" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 uppercase tracking-widest">Apply Link *</label>
              <input name="applyLink" value={form.applyLink} onChange={handle} required
                placeholder="https://..."
                className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 placeholder-slate-600" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 uppercase tracking-widest">Application Deadline *</label>
              <input type="date" name="deadline" value={form.deadline} onChange={handle} required
                className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500" />
            </div>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>}

          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors font-display">
            {loading ? 'Posting...' : '📢 Post Job'}
          </button>
        </form>
      </div>
    </div>
  );
}
