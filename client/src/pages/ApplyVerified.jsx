import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function ApplyVerified() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ reason: '', linkedin: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.get('/verify/status').then(({ data }) => {
      setStatus(data);
    }).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/verify/apply', form);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
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
            className="text-sm text-slate-400 hover:text-white border border-white/10 px-4 py-1.5 rounded-lg">
            ← Job Board
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h2 className="font-display text-3xl font-bold text-white mb-2">Apply for Verified</h2>
        <p className="text-slate-400 mb-8">Get verified to post job opportunities to the community</p>

        {status?.role === 'verified' ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-3">✅</div>
            <h3 className="font-display text-white text-xl font-bold mb-2">You are already verified!</h3>
            <p className="text-slate-400 text-sm mb-4">You can post jobs on the job board.</p>
            <button onClick={() => navigate('/post-job')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-semibold transition-all">
              Post a Job →
            </button>
          </div>
        ) : status?.request?.status === 'pending' ? (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-3">⏳</div>
            <h3 className="font-display text-white text-xl font-bold mb-2">Request Pending</h3>
            <p className="text-slate-400 text-sm">Your verification request is under review. The admin will review your profile and resume soon.</p>
          </div>
        ) : status?.request?.status === 'rejected' ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center mb-6">
            <div className="text-5xl mb-3">❌</div>
            <h3 className="font-display text-white text-xl font-bold mb-2">Previous Request Rejected</h3>
            <p className="text-slate-400 text-sm">Reason: {status.request.adminNote || 'No reason provided'}</p>
            <p className="text-slate-500 text-xs mt-2">You can submit a new request below.</p>
          </div>
        ) : null}

        {submitted ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="font-display text-white text-xl font-bold mb-2">Request Submitted!</h3>
            <p className="text-slate-400 text-sm">The admin will review your profile and resume. You'll get verified access once approved.</p>
          </div>
        ) : !status?.request || status?.request?.status === 'rejected' ? (
          <form onSubmit={submit} className="bg-[#17171f] border border-white/5 rounded-2xl p-8 space-y-5">
            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 text-sm text-slate-300">
              <p className="font-medium text-white mb-1">What happens after you apply?</p>
              <ul className="text-slate-400 text-xs space-y-1 mt-2">
                <li>→ Admin reviews your profile and uploaded resume</li>
                <li>→ If approved, you get a ✓ verified badge</li>
                <li>→ Verified users can post jobs on the board</li>
                <li>→ Your posts are visible to all users</li>
              </ul>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 uppercase tracking-widest">Why do you want to post jobs? *</label>
              <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                required rows={4}
                placeholder="e.g. I work at XYZ company and want to share open positions with the community..."
                className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 resize-none placeholder-slate-600" />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 uppercase tracking-widest">LinkedIn Profile (optional)</label>
              <input type="url" value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                placeholder="https://linkedin.com/in/yourprofile"
                className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 placeholder-slate-600" />
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>}

            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors font-display">
              {loading ? 'Submitting...' : '⭐ Submit Verification Request'}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
