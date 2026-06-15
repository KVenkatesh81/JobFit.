import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.username !== import.meta.env.VITE_ADMIN_USERNAME) {
      navigate('/dashboard');
      return;
    }
    fetchStats();
  }, []);

  useEffect(() => {
    if (tab === 'requests') fetchRequests();
    if (tab === 'users') fetchUsers();
    if (tab === 'jobs') fetchAdminJobs();
  }, [tab]);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/verify/admin/stats');
      setStats(data);
    } catch (err) { console.error(err); }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/verify/admin/requests');
      setRequests(data.requests);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/verify/admin/users');
      setUsers(data.users);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchAdminJobs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/verify/admin/jobs');
      setJobs(data.jobs);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleRequest = async (id, action) => {
    const adminNote = action === 'rejected' ? prompt('Reason for rejection (optional):') || '' : '';
    try {
      await api.patch(`/verify/admin/requests/${id}`, { action, adminNote });
      setRequests(prev => prev.filter(r => r._id !== id));
      fetchStats();
    } catch (err) { alert(err.response?.data?.message); }
  };

  const handleBan = async (id) => {
    try {
      const { data } = await api.patch(`/verify/admin/users/${id}/ban`);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, banned: data.banned } : u));
    } catch (err) { alert(err.response?.data?.message); }
  };

  const handleFeature = async (id) => {
    try {
      await api.patch(`/verify/admin/jobs/${id}/feature`);
      fetchAdminJobs();
    } catch (err) { alert(err.response?.data?.message); }
  };

  const handleDeleteJob = async (id) => {
    if (!confirm('Delete this job?')) return;
    try {
      await api.delete(`/verify/admin/jobs/${id}`);
      setJobs(prev => prev.filter(j => j._id !== id));
    } catch (err) { alert(err.response?.data?.message); }
  };

  return (
    <div className="min-h-screen bg-[#0f0f13]">
      <nav className="border-b border-white/5 bg-[#0f0f13]/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="font-display text-2xl font-bold">
            <span className="text-white">Job</span><span className="text-indigo-400">Fit</span><span className="text-white">.ai</span>
          </button>
          <span className="text-xs text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full">Admin Panel</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="font-display text-3xl font-bold text-white mb-6">Admin Panel</h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['stats', 'requests', 'users', 'jobs'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-medium capitalize transition-all ${tab === t ? 'bg-indigo-600 text-white' : 'bg-[#17171f] text-slate-400 border border-white/10'}`}>
              {t} {t === 'requests' && requests.length > 0 && `(${requests.length})`}
            </button>
          ))}
        </div>

        {/* Stats Tab */}
        {tab === 'stats' && stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Users', value: stats.totalUsers, color: 'text-blue-400' },
              { label: 'Verified Users', value: stats.verifiedUsers, color: 'text-green-400' },
              { label: 'Total Jobs', value: stats.totalJobs, color: 'text-indigo-400' },
              { label: 'Active Jobs', value: stats.activeJobs, color: 'text-yellow-400' },
              { label: 'Pending Requests', value: stats.pendingRequests, color: 'text-orange-400' },
              { label: 'Banned Users', value: stats.bannedUsers, color: 'text-red-400' },
            ].map((s, i) => (
              <div key={i} className="bg-[#17171f] border border-white/5 rounded-2xl p-6 text-center">
                <div className={`font-display text-4xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-slate-400 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Requests Tab */}
        {tab === 'requests' && (
          <div className="space-y-4">
            {loading ? <div className="text-slate-500 text-center py-10">Loading...</div> :
              requests.length === 0 ? <div className="text-slate-500 text-center py-10">No pending requests</div> :
              requests.map(r => (
                <div key={r._id} className="bg-[#17171f] border border-white/5 rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-display text-white font-semibold">{r.user?.name}</h3>
                      <p className="text-slate-400 text-xs">@{r.user?.username} · Joined {new Date(r.user?.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">Pending</span>
                  </div>
                  <p className="text-slate-300 text-sm mb-2">{r.reason}</p>
                  {r.linkedin && <a href={r.linkedin} target="_blank" rel="noopener noreferrer" className="text-indigo-400 text-xs hover:underline">LinkedIn ↗</a>}
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => handleRequest(r._id, 'approved')}
                      className="bg-green-600 hover:bg-green-500 text-white text-sm px-4 py-2 rounded-xl transition-all">
                      ✓ Approve
                    </button>
                    <button onClick={() => handleRequest(r._id, 'rejected')}
                      className="bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm px-4 py-2 rounded-xl border border-red-500/20 transition-all">
                      ✗ Reject
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="space-y-2">
            {loading ? <div className="text-slate-500 text-center py-10">Loading...</div> :
              users.map(u => (
                <div key={u._id} className="bg-[#17171f] border border-white/5 rounded-xl px-5 py-4 flex items-center justify-between">
                  <div>
                    <span className="text-white font-medium text-sm">{u.name}</span>
                    <span className="text-slate-500 text-xs ml-2">@{u.username}</span>
                    <span className={`text-xs ml-2 px-2 py-0.5 rounded-full ${u.role === 'verified' ? 'text-blue-400 bg-blue-500/10' : u.role === 'admin' ? 'text-yellow-400 bg-yellow-500/10' : 'text-slate-400 bg-slate-500/10'}`}>
                      {u.role}
                    </span>
                    {u.banned && <span className="text-xs ml-2 text-red-400">BANNED</span>}
                  </div>
                  {u.username !== import.meta.env.VITE_ADMIN_USERNAME && (
                    <button onClick={() => handleBan(u._id)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${u.banned ? 'text-green-400 border-green-500/20 hover:bg-green-500/10' : 'text-red-400 border-red-500/20 hover:bg-red-500/10'}`}>
                      {u.banned ? 'Unban' : 'Ban'}
                    </button>
                  )}
                </div>
              ))
            }
          </div>
        )}

        {/* Jobs Tab */}
        {tab === 'jobs' && (
          <div className="space-y-3">
            {loading ? <div className="text-slate-500 text-center py-10">Loading...</div> :
              jobs.map(j => (
                <div key={j._id} className="bg-[#17171f] border border-white/5 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-white font-medium text-sm">{j.title} <span className="text-slate-500">at {j.company}</span></h3>
                    <p className="text-slate-500 text-xs">by @{j.postedBy?.username} · 👁 {j.views} · 🖱 {j.applyClicks} clicks</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleFeature(j._id)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${j.featured ? 'text-yellow-400 border-yellow-500/20' : 'text-slate-400 border-white/10'}`}>
                      {j.featured ? '⭐ Featured' : 'Feature'}
                    </button>
                    <button onClick={() => handleDeleteJob(j._id)}
                      className="text-xs text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all">
                      Delete
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}
