import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const priorityColor = {
  high: 'text-red-400 bg-red-500/10 border-red-500/20',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  low: 'text-green-400 bg-green-500/10 border-green-500/20',
};

export default function Optimizer() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/resume/my').then(({ data }) => {
      setResumes(data.resumes);
      if (data.resumes.length > 0) setSelectedId(data.resumes[0]._id);
    });
  }, []);

  const optimize = async () => {
    if (!selectedId) return setError('Please upload a resume first');
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.post('/ai/optimize', {
        resumeId: selectedId,
        jobDescription: jd,
      });
      setResult(data.optimization);
    } catch (err) {
      setError(err.response?.data?.message || 'Optimization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f13]">
      <nav className="border-b border-white/5 bg-[#0f0f13]/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="font-display text-2xl font-bold">
            <span className="text-white">Job</span><span className="text-indigo-400">Fit</span><span className="text-white">.ai</span>
          </button>
          <button onClick={() => navigate('/dashboard')}
            className="text-sm text-slate-400 hover:text-white border border-white/10 px-4 py-1.5 rounded-lg transition-all">
            ← Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <h2 className="font-display text-3xl font-bold text-white mb-2">Resume Optimizer</h2>
        <p className="text-slate-400 mb-8">Get AI-powered suggestions to make your resume stand out</p>

        <div className="bg-[#17171f] border border-white/5 rounded-2xl p-6 mb-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 uppercase tracking-widest">Select Resume</label>
            <select
              value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
              className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500"
            >
              {resumes.length === 0 && <option>No resumes uploaded</option>}
              {resumes.map((r) => (
                <option key={r._id} value={r._id}>{r.filename}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 uppercase tracking-widest">
              Job Description <span className="text-slate-600 normal-case">(optional)</span>
            </label>
            <textarea
              value={jd} onChange={(e) => setJd(e.target.value)}
              rows={4}
              placeholder="Paste the job description for targeted optimization..."
              className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 resize-none placeholder-slate-600"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            onClick={optimize} disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors font-display"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                Optimizing with AI...
              </span>
            ) : '✍️ Optimize My Resume'}
          </button>
        </div>

        {result && (
          <div className="space-y-4">
            {/* Overall tip */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5">
              <p className="text-xs text-indigo-400 uppercase tracking-widest mb-1">💡 Top Tip</p>
              <p className="text-white text-sm leading-relaxed">{result.overall_tip}</p>
            </div>

            {/* Suggestions */}
            <div className="bg-[#17171f] border border-white/5 rounded-2xl p-6">
              <h3 className="font-display text-white font-semibold mb-4">📋 Section Suggestions</h3>
              <div className="space-y-3">
                {(result.suggestions || []).map((s, i) => (
                  <div key={i} className="bg-[#0f0f13] rounded-xl p-4 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium text-sm capitalize">{s.section}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColor[s.priority] || priorityColor.medium}`}>
                        {s.priority}
                      </span>
                    </div>
                    <p className="text-red-400 text-xs mb-1">Issue: {s.issue}</p>
                    <p className="text-green-400 text-xs">Fix: {s.fix}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bullet rewrites */}
            {result.bullet_rewrites?.length > 0 && (
              <div className="bg-[#17171f] border border-white/5 rounded-2xl p-6">
                <h3 className="font-display text-white font-semibold mb-4">✏️ Bullet Point Rewrites</h3>
                <div className="space-y-4">
                  {result.bullet_rewrites.map((b, i) => (
                    <div key={i} className="space-y-2">
                      <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                        <p className="text-xs text-red-400 mb-1">Original</p>
                        <p className="text-slate-300 text-sm">{b.original}</p>
                      </div>
                      <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-3">
                        <p className="text-xs text-green-400 mb-1">Improved</p>
                        <p className="text-slate-300 text-sm">{b.improved}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords + Format tips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#17171f] border border-white/5 rounded-2xl p-6">
                <h3 className="font-display text-white font-semibold mb-4">🔑 Keywords to Add</h3>
                <div className="flex flex-wrap gap-2">
                  {(result.keywords_to_add || []).map((k, i) => (
                    <span key={i} className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full">
                      + {k}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-[#17171f] border border-white/5 rounded-2xl p-6">
                <h3 className="font-display text-white font-semibold mb-4">🎨 Format Tips</h3>
                <ul className="space-y-2">
                  {(result.format_tips || []).map((t, i) => (
                    <li key={i} className="text-sm text-slate-300 flex gap-2">
                      <span className="text-indigo-400">→</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
