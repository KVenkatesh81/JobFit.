import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const recommendColor = {
  'Strong Yes': 'text-green-400 bg-green-500/10 border-green-500/20',
  'Yes': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'Maybe': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  'No': 'text-red-400 bg-red-500/10 border-red-500/20',
};

export default function CoverLetter() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [tone, setTone] = useState('Professional');
  const [jd, setJd] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('letter');

  useEffect(() => {
    api.get('/resume/my').then(({ data }) => {
      setResumes(data.resumes);
      if (data.resumes.length > 0) setSelectedId(data.resumes[0]._id);
    });
  }, []);

  const generate = async () => {
    if (!selectedId) return setError('Please upload a resume first');
    if (!companyName) return setError('Please enter company name');
    if (!jobTitle) return setError('Please enter job title');
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.post('/ai/cover-letter', {
        resumeId: selectedId,
        companyName,
        jobTitle,
        tone,
        jobDescription: jd,
      });
      setResult(data.result);
      setActiveTab('letter');
    } catch (err) {
      setError(err.response?.data?.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(result.cover_letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const jdAnalysis = result?.jd_analysis;

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
        <h2 className="font-display text-3xl font-bold text-white mb-2">Cover Letter + JD Analyzer</h2>
        <p className="text-slate-400 mb-8">Generate a tailored cover letter and get deep insights on the job posting</p>

        {/* Input Card */}
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
              <label className="text-xs text-slate-400 uppercase tracking-widest">Tone</label>
              <select value={tone} onChange={(e) => setTone(e.target.value)}
                className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500">
                <option>Professional</option>
                <option>Enthusiastic</option>
                <option>Confident</option>
                <option>Humble</option>
                <option>Creative</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 uppercase tracking-widest">Company Name</label>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Google, Microsoft, Razorpay"
                className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 placeholder-slate-600" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 uppercase tracking-widest">Job Title</label>
              <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. SDE Intern, Frontend Engineer"
                className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 placeholder-slate-600" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 uppercase tracking-widest">
              Job Description <span className="text-slate-600 normal-case">(paste for JD analysis + better letter)</span>
            </label>
            <textarea value={jd} onChange={(e) => setJd(e.target.value)} rows={5}
              placeholder="Paste the full job description here..."
              className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 resize-none placeholder-slate-600" />
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>}

          <button onClick={generate} disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors font-display">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                Generating cover letter...
              </span>
            ) : '📝 Generate Cover Letter + Analyze JD'}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex gap-2">
              {['letter', 'jd'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-indigo-600 text-white'
                      : 'bg-[#17171f] text-slate-400 border border-white/10 hover:border-white/20'
                  }`}>
                  {tab === 'letter' ? '📝 Cover Letter' : '🔍 JD Analysis'}
                </button>
              ))}
            </div>

            {/* Cover Letter Tab */}
            {activeTab === 'letter' && (
              <div className="bg-[#17171f] border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-white font-semibold">Cover Letter</h3>
                    <p className="text-slate-500 text-xs">{result.word_count} words · {tone} tone</p>
                  </div>
                  <button onClick={copy}
                    className={`text-sm px-4 py-2 rounded-xl border transition-all ${
                      copied
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20'
                    }`}>
                    {copied ? '✅ Copied!' : '📋 Copy'}
                  </button>
                </div>

                <div className="bg-[#0f0f13] border border-white/5 rounded-xl p-6">
                  <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">
                    {result.cover_letter}
                  </p>
                </div>

                {result.highlights?.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Key Highlights Used</p>
                    <div className="flex flex-wrap gap-2">
                      {result.highlights.map((h, i) => (
                        <span key={i} className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full">
                          ✓ {h}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* JD Analysis Tab */}
            {activeTab === 'jd' && jdAnalysis && (
              <div className="space-y-4">
                {/* Match Score + Recommendation */}
                <div className="bg-[#17171f] border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
                  <div className="text-center">
                    <div className={`font-display text-7xl font-bold ${jdAnalysis.match_score >= 70 ? 'text-green-400' : jdAnalysis.match_score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {jdAnalysis.match_score}%
                    </div>
                    <div className="text-slate-400 text-sm">match</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-sm px-3 py-1 rounded-full border font-medium ${recommendColor[jdAnalysis.apply_recommendation] || recommendColor['Maybe']}`}>
                        Apply: {jdAnalysis.apply_recommendation}
                      </span>
                      <span className="text-slate-500 text-xs">{jdAnalysis.experience_level} level</span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{jdAnalysis.recommendation_reason}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Required Skills */}
                  <div className="bg-[#17171f] border border-white/5 rounded-2xl p-5">
                    <h3 className="font-display text-white font-semibold mb-3">🎯 Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {(jdAnalysis.required_skills || []).map((s, i) => (
                        <span key={i} className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>

                  {/* Nice to Have */}
                  <div className="bg-[#17171f] border border-white/5 rounded-2xl p-5">
                    <h3 className="font-display text-white font-semibold mb-3">⭐ Nice to Have</h3>
                    <div className="flex flex-wrap gap-2">
                      {(jdAnalysis.nice_to_have || []).map((s, i) => (
                        <span key={i} className="text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-1 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Key Responsibilities */}
                <div className="bg-[#17171f] border border-white/5 rounded-2xl p-5">
                  <h3 className="font-display text-white font-semibold mb-3">📋 Key Responsibilities</h3>
                  <ul className="space-y-2">
                    {(jdAnalysis.key_responsibilities || []).map((r, i) => (
                      <li key={i} className="text-sm text-slate-300 flex gap-2">
                        <span className="text-indigo-400 mt-0.5">→</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Culture */}
                  <div className="bg-[#17171f] border border-white/5 rounded-2xl p-5">
                    <h3 className="font-display text-white font-semibold mb-3">🏢 Culture Keywords</h3>
                    <div className="flex flex-wrap gap-2">
                      {(jdAnalysis.culture_keywords || []).map((k, i) => (
                        <span key={i} className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-1 rounded-full">{k}</span>
                      ))}
                    </div>
                  </div>

                  {/* Red Flags */}
                  <div className="bg-[#17171f] border border-white/5 rounded-2xl p-5">
                    <h3 className="font-display text-white font-semibold mb-3">🚩 Red Flags</h3>
                    {jdAnalysis.red_flags?.length > 0 ? (
                      <ul className="space-y-1">
                        {jdAnalysis.red_flags.map((f, i) => (
                          <li key={i} className="text-xs text-red-400 flex gap-2">
                            <span>⚠</span>{f}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-green-400 text-sm">✅ No red flags found</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
