import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const categoryColor = {
  Technical: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Behavioral: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  HR: 'bg-green-500/10 text-green-400 border-green-500/20',
  'System Design': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

const difficultyColor = {
  Easy: 'text-green-400',
  Medium: 'text-yellow-400',
  Hard: 'text-red-400',
};

export default function InterviewQuestions() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    api.get('/resume/my').then(({ data }) => {
      setResumes(data.resumes);
      if (data.resumes.length > 0) setSelectedId(data.resumes[0]._id);
    });
  }, []);

  const generate = async () => {
    if (!selectedId) return setError('Please upload a resume first');
    setLoading(true);
    setError('');
    setResult(null);
    setExpanded(null);
    try {
      const { data } = await api.post('/ai/interview-questions', {
        resumeId: selectedId,
        targetRole,
        difficulty,
        jobDescription: jd,
      });
      setResult(data.result);
    } catch (err) {
      setError(err.response?.data?.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'Technical', 'Behavioral', 'HR', 'System Design'];
  const filtered = result?.questions?.filter(q => filter === 'All' || q.category === filter) || [];

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
        <h2 className="font-display text-3xl font-bold text-white mb-2">Interview Questions</h2>
        <p className="text-slate-400 mb-8">AI-generated questions tailored to your resume and target role</p>

        <div className="bg-[#17171f] border border-white/5 rounded-2xl p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 uppercase tracking-widest">Resume</label>
              <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
                className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500">
                {resumes.length === 0 && <option>No resumes uploaded</option>}
                {resumes.map((r) => <option key={r._id} value={r._id}>{r.filename}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 uppercase tracking-widest">Target Role</label>
              <input type="text" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. SDE Intern, Backend Engineer"
                className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 placeholder-slate-600" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 uppercase tracking-widest">Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500">
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 uppercase tracking-widest">
              Job Description <span className="text-slate-600 normal-case">(optional)</span>
            </label>
            <textarea value={jd} onChange={(e) => setJd(e.target.value)} rows={3}
              placeholder="Paste job description for role-specific questions..."
              className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 resize-none placeholder-slate-600" />
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>}

          <button onClick={generate} disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors font-display">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                Generating questions...
              </span>
            ) : '🎯 Generate Interview Questions'}
          </button>
        </div>

        {result && (
          <div className="space-y-4">
            {/* Header */}
            <div className="bg-[#17171f] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <h3 className="font-display text-white font-semibold">{result.target_role || 'Interview Prep'}</h3>
                <p className="text-slate-400 text-sm">{result.questions?.length} questions generated for {result.candidate_name || 'you'}</p>
              </div>
              <div className="text-4xl">🎯</div>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              {categories.map((c) => (
                <button key={c} onClick={() => setFilter(c)}
                  className={`text-xs px-4 py-2 rounded-full border transition-all ${
                    filter === c
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-[#17171f] border-white/10 text-slate-400 hover:border-white/20'
                  }`}>
                  {c}
                </button>
              ))}
            </div>

            {/* Questions */}
            <div className="space-y-3">
              {filtered.map((q) => (
                <div key={q.id} className="bg-[#17171f] border border-white/5 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                    className="w-full text-left p-5 flex items-start justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryColor[q.category] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                          {q.category}
                        </span>
                        <span className={`text-xs font-medium ${difficultyColor[q.difficulty]}`}>
                          {q.difficulty}
                        </span>
                      </div>
                      <p className="text-white text-sm font-medium leading-relaxed">{q.question}</p>
                    </div>
                    <span className="text-slate-400 text-lg flex-shrink-0">
                      {expanded === q.id ? '↑' : '↓'}
                    </span>
                  </button>

                  {expanded === q.id && (
                    <div className="px-5 pb-5 space-y-3 border-t border-white/5 pt-4">
                      <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-3">
                        <p className="text-xs text-indigo-400 mb-1">💡 Why asked</p>
                        <p className="text-slate-300 text-sm">{q.why_asked}</p>
                      </div>
                      <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-3">
                        <p className="text-xs text-green-400 mb-1">✅ Ideal answer</p>
                        <p className="text-slate-300 text-sm">{q.ideal_answer}</p>
                      </div>
                      {q.follow_ups?.length > 0 && (
                        <div className="bg-[#0f0f13] rounded-lg p-3">
                          <p className="text-xs text-slate-500 mb-2">🔄 Follow-up questions</p>
                          <ul className="space-y-1">
                            {q.follow_ups.map((f, i) => (
                              <li key={i} className="text-slate-400 text-xs flex gap-2">
                                <span className="text-indigo-400">→</span>{f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
