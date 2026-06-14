import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const gradeColor = {
  A: 'text-green-400', B: 'text-blue-400',
  C: 'text-yellow-400', D: 'text-orange-400', F: 'text-red-400'
};

const scoreColor = (s) => {
  if (s >= 80) return 'text-green-400';
  if (s >= 60) return 'text-blue-400';
  if (s >= 40) return 'text-yellow-400';
  return 'text-red-400';
};

export default function ATSScore() {
  const { logout } = useAuth();
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

  const analyze = async () => {
    if (!selectedId) return setError('Please upload a resume first');
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.post('/ai/ats-score', {
        resumeId: selectedId,
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
        <h2 className="font-display text-3xl font-bold text-white mb-2">ATS Score Analyzer</h2>
        <p className="text-slate-400 mb-8">See how Applicant Tracking Systems rate your resume</p>

        {/* Input Card */}
        <div className="bg-[#17171f] border border-white/5 rounded-2xl p-6 mb-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 uppercase tracking-widest">Select Resume</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
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
              Job Description <span className="text-slate-600 normal-case">(optional but recommended)</span>
            </label>
            <textarea
              value={jd} onChange={(e) => setJd(e.target.value)}
              rows={5}
              placeholder="Paste the job description here for a more accurate ATS score..."
              className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 resize-none placeholder-slate-600"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            onClick={analyze} disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors font-display"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                Analyzing with AI...
              </span>
            ) : '📊 Analyze ATS Score'}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Score Banner */}
            <div className="bg-[#17171f] border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
              <div className="text-center">
                <div className={`font-display text-7xl font-bold ${scoreColor(result.score)}`}>
                  {result.score}
                </div>
                <div className="text-slate-400 text-sm mt-1">out of 100</div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`font-display text-4xl font-bold ${gradeColor[result.grade]}`}>
                    Grade {result.grade}
                  </span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{result.summary}</p>
                {/* Score bar */}
                <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-1000"
                    style={{ width: `${result.score}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Sections Check */}
            <div className="bg-[#17171f] border border-white/5 rounded-2xl p-6">
              <h3 className="font-display text-white font-semibold mb-4">Resume Sections</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(result.sections || {}).map(([key, val]) => (
                  <div key={key} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${val ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                    <span>{val ? '✅' : '❌'}</span>
                    <span className="text-sm capitalize text-white">{key}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#17171f] border border-white/5 rounded-2xl p-6">
                <h3 className="font-display text-white font-semibold mb-4">💪 Strengths</h3>
                <ul className="space-y-2">
                  {(result.strengths || []).map((s, i) => (
                    <li key={i} className="text-sm text-slate-300 flex gap-2">
                      <span className="text-green-400 mt-0.5">→</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#17171f] border border-white/5 rounded-2xl p-6">
                <h3 className="font-display text-white font-semibold mb-4">⚠️ Weaknesses</h3>
                <ul className="space-y-2">
                  {(result.weaknesses || []).map((w, i) => (
                    <li key={i} className="text-sm text-slate-300 flex gap-2">
                      <span className="text-red-400 mt-0.5">→</span>{w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Keywords */}
            <div className="bg-[#17171f] border border-white/5 rounded-2xl p-6">
              <h3 className="font-display text-white font-semibold mb-4">🔑 Keywords</h3>
              <div className="mb-3">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Found</p>
                <div className="flex flex-wrap gap-2">
                  {(result.keywords_found || []).map((k, i) => (
                    <span key={i} className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Missing</p>
                <div className="flex flex-wrap gap-2">
                  {(result.keywords_missing || []).map((k, i) => (
                    <span key={i} className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/optimize')}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors font-display"
            >
              ✍️ Now Optimize My Resume →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
