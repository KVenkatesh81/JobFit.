import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const statusColor = {
  Applied: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Interviewing: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Offered: 'bg-green-500/10 text-green-400 border-green-500/20',
  Rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const statusList = ['Applied', 'Interviewing', 'Offered', 'Rejected'];

export default function Applications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => { fetchApplications(); }, []);

  const fetchApplications = async () => {
    try {
      const { data } = await api.get('/applications');
      setApplications(data.applications);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/applications/${id}`, { status });
      setApplications(prev => prev.map(a => a._id === id ? { ...a, status } : a));
    } catch (err) { console.error(err); }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/applications/${id}`);
      setApplications(prev => prev.filter(a => a._id !== id));
    } catch (err) { console.error(err); }
  };

  const filtered = filter === 'All' ? applications : applications.filter(a => a.status === filter);

  const counts = statusList.reduce((acc, s) => {
    acc[s] = applications.filter(a => a.status === s).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#0f0f13]">
      <nav className="border-b border-white/5 bg-[#0f0f13]/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="font-display text-2xl font-bold">
            <span className="text-white">Job</span><span className="text-indigo-400">Fit</span><span className="text-white">.ai</span>
          </button>
          <div className="flex gap-2">
            <button onClick={() => navigate('/jobs')}
              className="text-sm text-slate-400 hover:text-white border border-white/10 px-4 py-1.5 rounded-lg">
              Job Board
            </button>
            <button onClick={() => navigate('/dashboard')}
              className="text-sm text-slate-400 hover:text-white border border-white/10 px-4 py-1.5 rounded-lg">
              ← Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <h2 className="font-display text-3xl font-bold text-white mb-2">Application Tracker</h2>
        <p className="text-slate-400 mb-6">Track all your job applications in one place</p>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {statusList.map(s => (
            <div key={s} className={`rounded-xl p-4 border text-center ${statusColor[s]}`}>
              <div className="text-2xl font-display font-bold">{counts[s] || 0}</div>
              <div className="text-xs mt-1">{s}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['All', ...statusList].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm transition-all ${filter === f ? 'bg-indigo-600 text-white' : 'bg-[#17171f] text-slate-400 border border-white/10'}`}>
              {f} {f !== 'All' && `(${counts[f] || 0})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 mb-4">No applications yet</p>
            <button onClick={() => navigate('/jobs')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl text-sm transition-all">
              Browse Jobs →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((app) => (
              <div key={app._id} className="bg-[#17171f] border border-white/5 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-display text-white font-semibold">{app.job?.title}</h3>
                  <p className="text-slate-400 text-sm">{app.job?.company} · {app.job?.location}</p>
                  <p className="text-slate-500 text-xs mt-1">
                    Applied {new Date(app.createdAt).toLocaleDateString()}
                    {app.job?.deadline && ` · Deadline: ${new Date(app.job.deadline).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select value={app.status} onChange={(e) => updateStatus(app._id, e.target.value)}
                    className={`text-xs px-3 py-1.5 rounded-lg border bg-transparent outline-none cursor-pointer ${statusColor[app.status]}`}>
                    {statusList.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => remove(app._id)}
                    className="text-xs text-red-400 hover:text-red-300 border border-red-500/20 px-3 py-1.5 rounded-lg transition-all">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
