import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const difficultyColor = {
  Easy: 'text-green-400 bg-green-500/10 border-green-500/20',
  Medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  Hard: 'text-red-400 bg-red-500/10 border-red-500/20',
};

export default function TechBank() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [tips, setTips] = useState([]);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('questions');

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
      const { data } = await api.post('/ai/tech-questions', {
        resumeId: selectedId, targetRole, refresh: !!refresh,
      });
      setQuestions(data.result.questions);
      setTips(data.result.tips || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All'].concat([...new Set(questions.map(q => q.category))]);
  const filtered = questions.filter(q => {
    const matchCategory = filter === 'All' || q.category === filter;
    const matchSearch = q.question.toLowerCase().includes(search.toLowerCase()) ||
      q.topic.toLowerCase().includes(search.toLowerCase());
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
        <h2 className="font-display text-3xl font-bold text-white mb-2">Technical Question Bank</h2>
        <p className="text-slate-400 mb-8">50 questions based on your projects and skills, with prep tips</p>

        {questions.length === 0 && (
          <div className="bg-[#17171f] border border-white/5 rounded-2xl p-6 mb-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  placeholder="e.g. Backend Engineer, UI/UX Designer"
                  className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 placeholder-slate-600" />
              </div>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>}

            <button onClick={() => generate(false)} disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors font-display">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  Generating 50 questions + tips... this takes a moment
                </span>
              ) : '💻 Generate Technical Question Bank'}
            </button>
          </div>
        )}

        {questions.length > 0 && (
          <>
            <div className="flex gap-2 mb-6">
              {['questions', 'tips'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-[#17171f] text-slate-400 border border-white/10'}`}>
                  {tab === 'questions' ? `💻 Questions (${questions.length})` : `💡 Prep Tips (${tips.length})`}
                </button>
              ))}
              <button onClick={() => generate(true)} disabled={loading}
                className="ml-auto text-sm bg-[#17171f] hover:bg-[#1e1e2e] border border-white/10 text-white px-4 py-2 rounded-xl transition-all whitespace-nowrap">
                🔄 Regenerate
              </button>
            </div>

            {activeTab === 'questions' && (
              <>
                <div className="mb-4">
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by topic or keyword..."
                    className="w-full bg-[#17171f] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 placeholder-slate-600" />
                </div>

                <div className="flex gap-2 mb-6 flex-wrap">
                  {categories.map((c) => (
                    <button key={c} onClick={() => setFilter(c)}
                      className={`text-xs px-4 py-2 rounded-full border transition-all ${filter === c ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-[#17171f] border-white/10 text-slate-400 hover:border-white/20'}`}>
                      {c}
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
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${difficultyColor[q.difficulty] || difficultyColor.Medium}`}>{q.difficulty}</span>
                            <span className="text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">{q.topic}</span>
                          </div>
                          <p className="text-white text-sm font-medium leading-relaxed">{q.question}</p>
                        </div>
                        <span className="text-slate-400 text-lg flex-shrink-0">{expanded === q.id ? '↑' : '↓'}</span>
                      </button>

                      {expanded === q.id && (
                        <div className="px-5 pb-5 space-y-3 border-t border-white/5 pt-4">
                          <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-3">
                            <p className="text-xs text-indigo-400 mb-1">📌 From your resume</p>
                            <p className="text-slate-300 text-sm">{q.resume_reference}</p>
                          </div>
                          <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-3">
                            <p className="text-xs text-green-400 mb-1">✅ Ideal Answer</p>
                            <p className="text-slate-300 text-sm">{q.ideal_answer}</p>
                          </div>
                          <div className="bg-[#0f0f13] rounded-lg p-3 border border-white/5">
                            <p className="text-xs text-slate-500 mb-1">🔄 Likely Follow-up</p>
                            <p className="text-slate-300 text-sm">{q.follow_up}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'tips' && (
              <div className="space-y-3">
                {tips.map((t, i) => (
                  <div key={i} className="bg-[#17171f] border border-white/5 rounded-xl p-5">
                    <p className="text-xs text-indigo-400 mb-2 font-medium">{t.category}</p>
                    <p className="text-slate-300 text-sm leading-relaxed">{t.tip}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
