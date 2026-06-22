import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ATSScore from './pages/ATSScore';
import Optimizer from './pages/Optimizer';
import SkillGap from './pages/SkillGap';
import InterviewQuestions from './pages/InterviewQuestions';
import MockInterview from './pages/MockInterview';
import CoverLetter from './pages/CoverLetter';
import CompanyMatcher from './pages/CompanyMatcher';
import Jobs from './pages/Jobs';
import PostJob from './pages/PostJob';
import ApplyVerified from './pages/ApplyVerified';
import Applications from './pages/Applications';
import Admin from './pages/Admin';
import HRBank from './pages/HRBank';
import TechBank from './pages/TechBank';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/ats-score" element={<ProtectedRoute><ATSScore /></ProtectedRoute>} />
          <Route path="/optimize" element={<ProtectedRoute><Optimizer /></ProtectedRoute>} />
          <Route path="/skill-gap" element={<ProtectedRoute><SkillGap /></ProtectedRoute>} />
          <Route path="/interview-questions" element={<ProtectedRoute><InterviewQuestions /></ProtectedRoute>} />
          <Route path="/mock-interview" element={<ProtectedRoute><MockInterview /></ProtectedRoute>} />
          <Route path="/cover-letter" element={<ProtectedRoute><CoverLetter /></ProtectedRoute>} />
          <Route path="/company-matcher" element={<ProtectedRoute><CompanyMatcher /></ProtectedRoute>} />
          <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
          <Route path="/post-job" element={<ProtectedRoute><PostJob /></ProtectedRoute>} />
          <Route path="/apply-verified" element={<ProtectedRoute><ApplyVerified /></ProtectedRoute>} />
          <Route path="/applications" element={<ProtectedRoute><Applications /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="/hr-bank" element={<ProtectedRoute><HRBank /></ProtectedRoute>} />
          <Route path="/tech-bank" element={<ProtectedRoute><TechBank /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
