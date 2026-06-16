import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const typeColor = {
  FAANG: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Startup: 'bg-green-500/10 text-green-400 border-green-500/20',
  MNC: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Product: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Service: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const difficultyColor = { Easy: 'text-green-400', Medium: 'text-yellow-400', Hard: 'text-red-400' };
const demandColor = { High: 'text-green-400', Medium: 'text-yellow-400', Low: 'text-red-400' };
const hardnessColor = { Easy: 'text-green-400', Medium: 'text-yellow-400', Hard: 'text-red-400' };

export default function CompanyMatcher() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [preferences, setPreferences] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('companies');
  const [expandedCompany, setExpandedCompany] = useState(null);

  useEffect(() => {
    api.get('/resume/my').then(({ data }) => {
      setResumes(data.resumes);
      if (data.resumes.length > 0) setSelectedId(data.resumes[0]._id);
    });
  }, []);

  const match = async () => {
    if (!selectedId) return setError('Please upload a resume first');
    setLoading(true); setError(''); setResult(null);
    try {
      const { data } = await api.post('/ai/company-match', { resumeId: selectedId, preferences });
      setResult(data.result);
    } catch (err) {
      setError(err.response?.data?.message || 'Matching failed');
    } finally { setLoading(false); }
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
        <h2 className="font-display text-3xl font-bold text-white mb-2">Company Matcher</h2>
        <p className="text-slate-400 mb-8">Find matching companies with full interview process breakdown</p>

        <div className="bg-[#17171f] border border-white/5 rounded-2xl p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 uppercase tracking-widest">Resume</label>
              <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
                className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500">
                {resumes.length === 0 && <option>No resumes uploaded</option>}
                {resumes.map((r) => <option key={r._id} value={r._id}>{r.filename}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 uppercase tracking-widest">Preferences</label>
              <input type="text" value={preferences} onChange={(e) => setPreferences(e.target.value)}
                placeholder="e.g. Startups in Bangalore, Remote, Fintech"
                className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 placeholder-slate-600" />
            </div>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>}

          <button onClick={match} disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors font-display">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                Finding matches...
              </span>
            ) : '🏢 Find Matching Companies + Career Paths'}
          </button>
        </div>

        {result && (
          <div className="space-y-4">
            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-5">
              <p className="text-xs text-indigo-400 uppercase tracking-widest mb-1">Your Profile</p>
              <p className="text-white text-sm leading-relaxed">{result.profile_summary}</p>
            </div>

            <div className="flex gap-2">
              {['companies', 'career'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-[#17171f] text-slate-400 border border-white/10'}`}>
                  {tab === 'companies' ? '🏢 Companies' : '🗺️ Career Paths'}
                </button>
              ))}
            </div>

            {activeTab === 'companies' && (
              <div className="space-y-4">
                {(result.companies || []).map((c, i) => (
                  <div key={i} className="bg-[#17171f] border border-white/5 rounded-2xl overflow-hidden">
                    {/* Company Header */}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-display text-white font-bold text-xl">{c.name}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${typeColor[c.type] || typeColor.MNC}`}>{c.type}</span>
                            <span className={`text-xs ${difficultyColor[c.difficulty]}`}>{c.difficulty} to get in</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-display text-3xl font-bold ${c.match_score >= 80 ? 'text-green-400' : c.match_score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {c.match_score}%
                          </div>
                          <div className="text-slate-500 text-xs">match</div>
                        </div>
                      </div>

                      <p className="text-slate-400 text-xs mb-2">{c.why_match}</p>
                      <p className="text-slate-500 text-xs italic mb-3">Known for: {c.known_for}</p>

                      {/* Culture */}
                      <div className="bg-[#0f0f13] rounded-xl p-3 border border-white/5 mb-3">
                        <p className="text-xs text-purple-400 mb-1">🏢 Company Culture</p>
                        <p className="text-slate-300 text-xs">{c.company_culture}</p>
                      </div>

                      {/* Roles */}
                      <div className="mb-3">
                        <p className="text-xs text-slate-500 mb-1">Roles you can apply for</p>
                        <div className="flex flex-wrap gap-1">
                          {(c.roles || []).map((r, j) => (
                            <span key={j} className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">{r}</span>
                          ))}
                        </div>
                      </div>

                      {/* DSA requirement */}
                      {c.interview_process?.oa_has_dsa && (
                        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3 mb-3">
                          <p className="text-xs text-yellow-400 mb-1">⚡ OA has DSA/CP</p>
                          <p className="text-slate-300 text-xs">Required level: {c.interview_process?.dsa_level_required}</p>
                        </div>
                      )}

                      {/* Prep tip */}
                      <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-3 mb-3">
                        <p className="text-xs text-indigo-400 mb-1">💡 Prep Tip</p>
                        <p className="text-slate-300 text-xs">{c.prep_tip}</p>
                      </div>

                      {/* Match bar */}
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-3">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${c.match_score}%` }} />
                      </div>

                      {/* Toggle rounds */}
                      <button
                        onClick={() => setExpandedCompany(expandedCompany === i ? null : i)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-all">
                        {expandedCompany === i ? '▲ Hide Interview Rounds' : `▼ View All ${c.interview_process?.total_rounds} Interview Rounds`}
                      </button>
                    </div>

                    {/* Interview Rounds */}
                    {expandedCompany === i && c.interview_process?.rounds && (
                      <div className="border-t border-white/5 p-5 space-y-3">
                        <h4 className="font-display text-white font-semibold text-sm mb-3">
                          📋 Interview Process — {c.interview_process.total_rounds} Rounds
                        </h4>
                        {c.interview_process.rounds.map((round, j) => (
                          <div key={j} className="bg-[#0f0f13] rounded-xl p-4 border border-white/5">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold font-display">
                                  {round.round_number}
                                </span>
                                <span className="text-white font-medium text-sm">{round.name}</span>
                                <span className="text-xs text-slate-500">{round.type}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-medium ${hardnessColor[round.hardness]}`}>{round.hardness}</span>
                                <span className="text-xs text-slate-500">{round.duration}</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {(round.topics || []).map((t, k) => (
                                <span key={k} className="text-xs bg-white/5 text-slate-400 px-2 py-0.5 rounded-full">{t}</span>
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {(round.question_types || []).map((t, k) => (
                                <span key={k} className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">{t}</span>
                              ))}
                            </div>
                            <p className="text-slate-400 text-xs">{round.tips}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'career' && (
              <div className="space-y-4">
                {(result.career_paths || []).map((path, i) => (
                  <div key={i} className="bg-[#17171f] border border-white/5 rounded-2xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-display text-white font-bold text-lg">{path.path}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-slate-400 text-xs">⏱ {path.timeline}</span>
                          <span className="text-slate-400 text-xs">→ {path.end_role}</span>
                          <span className={`text-xs font-medium ${demandColor[path.demand]}`}>{path.demand} demand</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 text-sm font-semibold font-display">{path.avg_salary}</p>
                        <p className="text-slate-500 text-xs">avg salary</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center flex-wrap">
                      {(path.steps || []).map((step, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <span className="text-sm text-slate-300 bg-[#0f0f13] border border-white/5 px-3 py-1.5 rounded-lg">{step}</span>
                          {j < path.steps.length - 1 && <span className="text-indigo-400 text-xs">→</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {result.immediate_actions?.length > 0 && (
                  <div className="bg-[#17171f] border border-white/5 rounded-2xl p-5">
                    <h3 className="font-display text-white font-semibold mb-3">⚡ Do These Now</h3>
                    <ul className="space-y-2">
                      {result.immediate_actions.map((a, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                          <span className="text-indigo-400 font-bold font-display">{i + 1}.</span>{a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
