import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const typeColor = {
  Remote: 'text-green-400 bg-green-500/10 border-green-500/20',
  Onsite: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Hybrid: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
};

export default function Jobs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [savedIds, setSavedIds] = useState([]);
  const [matchScores, setMatchScores] = useState({});
  const [matchLoading, setMatchLoading] = useState({});

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    try {
      const { data } = await api.get('/jobs');
      setJobs(data.jobs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = async (jobId) => {
    try {
      const { data } = await api.post(`/jobs/${jobId}/save`);
      setSavedIds(prev =>
        data.saved ? [...prev, jobId] : prev.filter(id => id !== jobId)
      );
    } catch (err) { console.error(err); }
  };

  const getMatchScore = async (jobId) => {
    setMatchLoading(prev => ({ ...prev, [jobId]: true }));
    try {
      const { data } = await api.post(`/jobs/${jobId}/match`);
      setMatchScores(prev => ({ ...prev, [jobId]: data.match }));
    } catch (err) { console.error(err); }
    finally { setMatchLoading(prev => ({ ...prev, [jobId]: false })); }
  };

  const handleApply = async (job) => {
    await api.post(`/jobs/${job._id}/apply-click`);
    await api.post('/applications', { jobId: job._id });
    window.open(job.applyLink, '_blank');
  };

  const filtered = jobs.filter(j => {
    const matchesSearch = j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.company.toLowerCase().includes(search.toLowerCase()) ||
      j.skills.some(s => s.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = filter === 'All' || j.type === filter;
    return matchesSearch && matchesFilter;
  });

  const scoreColor = (s) => s >= 80 ? 'text-green-400' : s >= 60 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="min-h-screen bg-[#0f0f13]">
      <nav className="border-b border-white/5 bg-[#0f0f13]/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="font-display text-2xl font-bold">
            <span className="text-white">Job</span><span className="text-indigo-400">Fit</span><span className="text-white">.ai</span>
          </button>
          <div className="flex items-center gap-3">
            {(user?.role === 'verified' || user?.role === 'admin') && (
              <button onClick={() => navigate('/post-job')}
                className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg transition-all">
                + Post Job
              </button>
            )}
            <button onClick={() => navigate('/applications')}
              className="text-sm text-slate-400 hover:text-white border border-white/10 px-4 py-1.5 rounded-lg transition-all">
              My Applications
            </button>
            <button onClick={() => navigate('/dashboard')}
              className="text-sm text-slate-400 hover:text-white border border-white/10 px-4 py-1.5 rounded-lg transition-all">
              ← Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-3xl font-bold text-white">Job Board</h2>
            <p className="text-slate-400 text-sm mt-1">Opportunities posted by verified members</p>
          </div>
          {user?.role === 'user' && (
            <button onClick={() => navigate('/apply-verified')}
              className="text-sm bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-4 py-2 rounded-xl hover:bg-yellow-500/20 transition-all">
              ⭐ Apply for Verified
            </button>
          )}
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by role, company, or skill..."
            className="flex-1 bg-[#17171f] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 placeholder-slate-600" />
          <div className="flex gap-2">
            {['All', 'Remote', 'Onsite', 'Hybrid'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm transition-all ${filter === f ? 'bg-indigo-600 text-white' : 'bg-[#17171f] text-slate-400 border border-white/10'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">No jobs found</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((job) => {
              const isSaved = savedIds.includes(job._id);
              const match = matchScores[job._id];
              const isLoadingMatch = matchLoading[job._id];
              const daysLeft = Math.ceil((new Date(job.deadline) - new Date()) / (1000 * 60 * 60 * 24));

              return (
                <div key={job._id} className={`bg-[#17171f] border rounded-2xl p-5 transition-all hover:border-indigo-500/30 ${job.featured ? 'border-yellow-500/30' : 'border-white/5'}`}>
                  {job.featured && (
                    <div className="text-xs text-yellow-400 mb-2">⭐ Featured</div>
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-display text-white font-bold text-lg">{job.title}</h3>
                      <p className="text-slate-400 text-sm">{job.company} · {job.location}</p>
                    </div>
                    <button onClick={() => toggleSave(job._id)}
                      className={`text-xl transition-all ${isSaved ? 'text-yellow-400' : 'text-slate-600 hover:text-slate-400'}`}>
                      {isSaved ? '🔖' : '🔖'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${typeColor[job.type]}`}>{job.type}</span>
                    {job.salary && <span className="text-xs text-green-400">💰 {job.salary}</span>}
                    <span className={`text-xs ${daysLeft <= 3 ? 'text-red-400' : 'text-slate-500'}`}>
                      ⏰ {daysLeft <= 0 ? 'Expired' : `${daysLeft}d left`}
                    </span>
                  </div>

                  <p className="text-slate-400 text-xs mb-3 line-clamp-2">{job.description}</p>

                  {job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {job.skills.slice(0, 5).map((s, i) => (
                        <span key={i} className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  )}

                  {/* AI Match Score */}
                  {match ? (
                    <div className={`text-xs mb-3 px-3 py-2 rounded-lg border ${match.match_score >= 70 ? 'bg-green-500/5 border-green-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
                      <span className={`font-bold ${scoreColor(match.match_score)}`}>{match.match_score}% match</span>
                      <span className="text-slate-400 ml-2">{match.verdict}</span>
                    </div>
                  ) : (
                    <button onClick={() => getMatchScore(job._id)} disabled={isLoadingMatch}
                      className="text-xs text-indigo-400 hover:text-indigo-300 mb-3 block transition-all">
                      {isLoadingMatch ? '⏳ Checking match...' : '🎯 Check my match score'}
                    </button>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-500">by</span>
                      <span className="text-xs text-white">{job.postedBy?.name}</span>
                      {job.postedBy?.role === 'verified' && (
                        <span className="text-xs text-blue-400">✓</span>
                      )}
                      <span className="text-xs text-slate-600 ml-2">👁 {job.views}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => navigate(`/jobs/${job._id}`)}
                        className="text-xs text-slate-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg transition-all">
                        Details
                      </button>
                      <button onClick={() => handleApply(job)}
                        className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-all">
                        Apply Now →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
