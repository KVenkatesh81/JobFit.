import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const priorityColor = {
  high: 'text-red-400 bg-red-500/10 border-red-500/20',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  low: 'text-green-400 bg-green-500/10 border-green-500/20',
};

export default function SkillGap() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [targetRole, setTargetRole] = useState('');
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

  const analyze = async () => {
    if (!selectedId) return setError('Please upload a resume first');
    if (!targetRole) return setError('Please enter a target role');
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.post('/ai/skill-gap', {
        resumeId: selectedId,
        targetRole,
        jobDescription: jd,
      });
      setResult(data.analysis);
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed');
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
        <h2 className="font-display text-3xl font-bold text-white mb-2">Skill Gap Analysis</h2>
        <p className="text-slate-400 mb-8">Know exactly what skills to learn to land your dream role</p>

        <div className="bg-[#17171f] border border-white/5 rounded-2xl p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 uppercase tracking-widest">Select Resume</label>
              <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
                className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500">
                {resumes.length === 0 && <option>No resumes uploaded</option>}
                {resumes.map((r) => <option key={r._id} value={r._id}>{r.filename}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 uppercase tracking-widest">Target Role</label>
              <input type="text" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Frontend Engineer, Data Scientist"
                className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 placeholder-slate-600" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 uppercase tracking-widest">
              Job Description <span className="text-slate-600 normal-case">(optional)</span>
            </label>
            <textarea value={jd} onChange={(e) => setJd(e.target.value)} rows={4}
              placeholder="Paste job description for more accurate gap analysis..."
              className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 resize-none placeholder-slate-600" />
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>}

          <button onClick={analyze} disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors font-display">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                Analyzing skill gap...
              </span>
            ) : '🧩 Analyze Skill Gap'}
          </button>
        </div>

        {result && (
          <div className="space-y-4">
            {/* Match Banner */}
            <div className="bg-[#17171f] border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
              <div className="text-center">
                <div className={`font-display text-7xl font-bold ${result.match_percentage >= 70 ? 'text-green-400' : result.match_percentage >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {result.match_percentage}%
                </div>
                <div className="text-slate-400 text-sm mt-1">match</div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-display text-white text-xl font-bold">{result.target_role}</span>
                  <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                    {result.current_level}
                  </span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{result.summary}</p>
                <div className="mt-3 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-indigo-500 transition-all duration-1000"
                    style={{ width: `${result.match_percentage}%` }} />
                </div>
                <p className="text-slate-500 text-xs mt-2">⏱ {result.timeline}</p>
              </div>
            </div>

            {/* Strong Skills */}
            <div className="bg-[#17171f] border border-white/5 rounded-2xl p-6">
              <h3 className="font-display text-white font-semibold mb-4">💪 Your Strong Skills</h3>
              <div className="flex flex-wrap gap-2">
                {(result.strong_skills || []).map((s, i) => (
                  <span key={i} className="text-sm bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-full">
                    ✓ {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Skills */}
            <div className="bg-[#17171f] border border-white/5 rounded-2xl p-6">
              <h3 className="font-display text-white font-semibold mb-4">⚠️ Skills to Learn</h3>
              <div className="space-y-3">
                {(result.missing_skills || []).map((s, i) => (
                  <div key={i} className="bg-[#0f0f13] rounded-xl p-4 border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium text-sm">{s.skill}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 text-xs">⏱ {s.learn_time}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityColor[s.priority] || priorityColor.medium}`}>
                          {s.priority}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs">{s.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Path */}
            <div className="bg-[#17171f] border border-white/5 rounded-2xl p-6">
              <h3 className="font-display text-white font-semibold mb-4">🗺️ Learning Path</h3>
              <div className="space-y-4">
                {(result.learning_path || []).map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold font-display">
                      {step.step}
                    </div>
                    <div className="flex-1 pb-4 border-b border-white/5 last:border-0">
                      <h4 className="text-white font-medium text-sm mb-1">{step.title}</h4>
                      <p className="text-slate-400 text-xs mb-2">{step.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {(step.resources || []).map((r, j) => (
                          <span key={j} className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => navigate('/interview-questions')}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors font-display">
              🎯 Generate Interview Questions →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
