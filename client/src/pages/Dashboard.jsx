import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const features = [
  { id: 1, icon: '📊', label: 'ATS Score', desc: 'See how recruiters\' systems rate your resume', day: 2, route: '/ats-score', ready: true },
  { id: 2, icon: '✍️', label: 'Resume Optimizer', desc: 'AI suggestions to maximize your chances', day: 2, route: '/optimize', ready: true },
  { id: 3, icon: '🧩', label: 'Skill Gap Analysis', desc: 'Know exactly what skills to learn next', day: 3, route: '/skill-gap', ready: true },
  { id: 4, icon: '🎯', label: 'Interview Questions', desc: 'Role-specific questions from your resume', day: 3, route: '/interview-questions', ready: true },
  { id: 5, icon: '🎤', label: 'Mock Interview', desc: 'Voice-based AI interview with real-time grading', day: 4, route: '/mock-interview', ready: true },
  { id: 6, icon: '📝', label: 'Cover Letter', desc: 'Personalized letters + JD analysis', day: 5, route: '/cover-letter', ready: true },
  { id: 7, icon: '🏢', label: 'Company Matcher', desc: 'Find companies + career paths that fit you', day: 6, route: '/company-matcher', ready: true },
  { id: 8, icon: '❓', label: 'HR Question Bank', desc: '50+ HR questions with tailored answers', day: 7, route: null, ready: false },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef();

  useEffect(() => { fetchResumes(); }, []);

  const fetchResumes = async () => {
    try {
      const { data } = await api.get('/resume/my');
      setResumes(data.resumes);
    } catch (err) { console.error('Failed to fetch resumes'); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) return setUploadError('Only PDF and DOCX files are allowed');
    setUploading(true); setUploadMsg(''); setUploadError('');
    const formData = new FormData();
    formData.append('resume', file);
    try {
      await api.post('/resume/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadMsg('✅ Resume uploaded and text extracted!');
      fetchResumes();
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      fileRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f13]">
      <nav className="border-b border-white/5 bg-[#0f0f13]/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">
            <span className="text-white">Job</span><span className="text-indigo-400">Fit</span><span className="text-white">.ai</span>
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm hidden sm:block">
              Hey, <span className="text-white font-medium">{user?.name}</span>
            </span>
            <button onClick={() => { logout(); navigate('/login'); }}
              className="text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/20 px-4 py-1.5 rounded-lg transition-all">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="bg-[#17171f] border border-white/5 rounded-2xl p-8 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h2 className="font-display text-2xl font-semibold text-white mb-1">Your Resume</h2>
              <p className="text-slate-400 text-sm">Upload your resume to unlock all AI features</p>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2">
              <input type="file" ref={fileRef} onChange={handleUpload} accept=".pdf,.docx" className="hidden" id="resume-input" />
              <label htmlFor="resume-input"
                className={`cursor-pointer inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${uploading ? 'bg-indigo-700 opacity-60 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}>
                {uploading ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />Uploading...</> : '📄 Upload Resume (PDF / DOCX)'}
              </label>
              {uploadMsg && <p className="text-green-400 text-xs">{uploadMsg}</p>}
              {uploadError && <p className="text-red-400 text-xs">{uploadError}</p>}
            </div>
          </div>

          {resumes.length > 0 && (
            <div className="mt-6 border-t border-white/5 pt-6 space-y-3">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Uploaded Resumes</p>
              {resumes.map((r) => (
                <div key={r._id} className="flex items-center justify-between bg-[#0f0f13] rounded-xl px-4 py-3 border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{r.fileType === 'pdf' ? '📕' : '📘'}</span>
                    <div>
                      <p className="text-white text-sm font-medium">{r.filename}</p>
                      <p className="text-slate-500 text-xs">
                        {new Date(r.createdAt).toLocaleDateString()} ·{' '}
                        {r.extractedText ? `${r.extractedText.split(' ').length} words extracted` : 'No text extracted'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {r.atsScore && <span className="text-xs text-indigo-400 font-semibold">ATS: {r.atsScore}</span>}
                    <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 text-xs hover:underline">View ↗</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <h3 className="font-display text-lg font-semibold text-white mb-5">
          AI Features <span className="text-slate-500 font-normal text-sm ml-2">— click to use</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.id}
              onClick={() => f.ready && f.route && navigate(f.route)}
              className={`relative bg-[#17171f] border border-white/5 rounded-xl p-5 transition-all ${f.ready ? 'hover:border-indigo-500/50 cursor-pointer hover:bg-[#1e1e2e]' : 'opacity-50 cursor-default'}`}>
              <div className="text-3xl mb-3">{f.icon}</div>
              <h4 className="font-display text-white font-semibold text-sm mb-1">{f.label}</h4>
              <p className="text-slate-500 text-xs leading-relaxed">{f.desc}</p>
              <div className="absolute top-3 right-3">
                {f.ready
                  ? <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">Ready ✓</span>
                  : <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">Day {f.day}</span>
                }
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
