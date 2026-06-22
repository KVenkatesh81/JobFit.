import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const categoryIcons = {
  'Introduction & Background': '👋',
  'Strengths & Weaknesses': '💪',
  'Career Goals': '🎯',
  'Situational & Behavioral': '🎭',
  'Company & Role Fit': '🏢',
  'Teamwork & Conflict': '🤝',
  'Salary & Negotiation': '💰',
  'Failure & Learning': '📚',
  'Leadership': '👑',
  'Stress & Pressure': '🔥',
};

export default function HRBank() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/resume/my').then(({ data }) => {
      setResumes(data.resumes);
      if (data.resumes.length > 0) setSelectedId(data.resumes[0]._id);
    });
  }, []);

  const generate = async (refresh) => {
    if (!selectedId) { setError('Please upload a resume first'); return; }
    setLoading(true);
    setError('');
    setExpanded(null);
    try {
      const { data } = await api.post('/ai/hr-questions', {
        resumeId: selectedId, targetRole, targetCompany, refresh: !!refresh,
      });
      setQuestions(data.result.questions);
    } catch (err) {
      setError(err.response?.data?.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All'].concat([...new Set(questions.map(q => q.category))]);
  const filtered = questions.filter(q => {
    const matchCategory = filter === 'All' || q.category === filter;
    const matchSearch = q.question.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

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
        <h2 className="font-display text-3xl font-bold text-white mb-2">HR Question Bank</h2>
        <p className="text-slate-400 mb-8">50+ personalized HR questions with sample answers based on your resume</p>

        {questions.length === 0 && (
          <div className="bg-[#17171f] border border-white/5 rounded-2xl p-6 mb-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 uppercase tracking-widest">Resume</label>
                <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500">
                  {resumes.map((r) => <option key={r._id} value={r._id}>{r.filename}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 uppercase tracking-widest">Target Role</label>
                <input type="text" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. SDE Intern"
                  className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 placeholder-slate-600" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400 uppercase tracking-widest">Target Company</label>
                <input type="text" value={targetCompany} onChange={(e) => setTargetCompany(e.target.value)}
                  placeholder="e.g. Google"
                  className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 placeholder-slate-600" />
              </div>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>}

            <button onClick={() => generate(false)} disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors font-display">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  Generating 50+ questions... this takes a moment
                </span>
              ) : '❓ Generate HR Question Bank'}
            </button>
          </div>
        )}

        {questions.length > 0 && (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions..."
                className="flex-1 bg-[#17171f] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 placeholder-slate-600" />
              <button onClick={() => generate(true)} disabled={loading}
                className="text-sm bg-[#17171f] hover:bg-[#1e1e2e] border border-white/10 text-white px-4 py-3 rounded-xl transition-all whitespace-nowrap">
                🔄 Regenerate
              </button>
            </div>

            <div className="flex gap-2 mb-6 flex-wrap">
              {categories.map((c) => (
                <button key={c} onClick={() => setFilter(c)}
                  className={`text-xs px-4 py-2 rounded-full border transition-all ${filter === c ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-[#17171f] border-white/10 text-slate-400 hover:border-white/20'}`}>
                  {c !== 'All' ? (categoryIcons[c] || '') : ''} {c}
                </button>
              ))}
            </div>

            <p className="text-slate-500 text-xs mb-4">{filtered.length} questions</p>

            <div className="space-y-3">
              {filtered.map((q) => (
                <div key={q.id} className="bg-[#17171f] border border-white/5 rounded-xl overflow-hidden">
                  <button onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                    className="w-full text-left p-5 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full mb-2 inline-block">
                        {categoryIcons[q.category] || ''} {q.category}
                      </span>
                      <p className="text-white text-sm font-medium leading-relaxed">{q.question}</p>
                    </div>
                    <span className="text-slate-400 text-lg flex-shrink-0">{expanded === q.id ? '↑' : '↓'}</span>
                  </button>

                  {expanded === q.id && (
                    <div className="px-5 pb-5 space-y-3 border-t border-white/5 pt-4">
                      <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-3">
                        <p className="text-xs text-indigo-400 mb-1">🎯 What they're checking</p>
                        <p className="text-slate-300 text-sm">{q.what_they_check}</p>
                      </div>
                      <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3">
                        <p className="text-xs text-blue-400 mb-1">📐 Answer Structure</p>
                        <p className="text-slate-300 text-sm">{q.ideal_answer_structure}</p>
                      </div>
                      <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-3">
                        <p className="text-xs text-green-400 mb-1">✅ Sample Answer</p>
                        <p className="text-slate-300 text-sm">{q.sample_answer}</p>
                      </div>
                      <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-3">
                        <p className="text-xs text-red-400 mb-1">⚠️ Mistakes to Avoid</p>
                        <p className="text-slate-300 text-sm">{q.mistakes_to_avoid}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
