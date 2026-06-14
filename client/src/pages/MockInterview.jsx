import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function MockInterview() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [phase, setPhase] = useState('setup');
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [grading, setGrading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(120);
  const [timerActive, setTimerActive] = useState(false);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    api.get('/resume/my').then(({ data }) => {
      setResumes(data.resumes);
      if (data.resumes.length > 0) setSelectedId(data.resumes[0]._id);
    });
  }, []);

  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      stopListening();
    }
    return () => clearTimeout(timerRef.current);
  }, [timerActive, timeLeft]);

  const startInterview = async () => {
    if (!selectedId) return setError('Please select a resume');
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/ai/interview-questions', {
        resumeId: selectedId,
        targetRole: targetRole || 'Software Engineer',
        difficulty: 'Medium',
      });
      const qs = data.result.questions.slice(0, 5);
      setQuestions(qs);
      setAnswers(new Array(qs.length).fill(''));
      setCurrentQ(0);
      setPhase('interview');
      setTimeLeft(120);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start interview');
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported. Please type your answer below.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (e) => {
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
      }
      if (final) setTranscript(prev => prev + final);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setTimerActive(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
    setTimerActive(false);
  };

  const submitAnswer = () => {
    stopListening();
    const updated = [...answers];
    updated[currentQ] = transcript;
    setAnswers(updated);
    setTranscript('');
    setTimeLeft(120);
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1);
    } else {
      gradeInterview(updated);
    }
  };

  const gradeInterview = async (finalAnswers) => {
    setPhase('grading');
    setGrading(true);
    try {
      const qa = questions.map((q, i) => ({
        question: q.question,
        category: q.category,
        ideal: q.ideal_answer,
        answer: finalAnswers[i] || '(No answer provided)',
      }));

      const prompt = `You are a strict but fair technical interviewer grading a mock interview.

Interview Q&A:
${qa.map((q, i) => `Q${i + 1} [${q.category}]: ${q.question}
Ideal Answer: ${q.ideal}
Candidate Answer: ${q.answer}`).join('\n\n')}

Grade each answer and provide overall feedback. Return ONLY valid JSON:
{
  "overall_score": <number 0-100>,
  "overall_grade": "<A/B/C/D/F>",
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength1>", "<strength2>"],
  "improvements": ["<improvement1>", "<improvement2>"],
  "answers": [
    {
      "question": "<question>",
      "score": <0-10>,
      "feedback": "<specific feedback>",
      "what_was_good": "<what they did well>",
      "what_to_improve": "<what to improve>"
    }
  ]
}
Return ONLY the JSON, no explanation, no markdown.`;

      const { data } = await api.post('/ai/grade-interview', { prompt });
      setReport(data.report);
      setPhase('report');
    } catch (err) {
      setError('Grading failed: ' + (err.response?.data?.message || err.message));
      setPhase('interview');
    } finally {
      setGrading(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-[#0f0f13]">
      <nav className="border-b border-white/5 bg-[#0f0f13]/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="font-display text-2xl font-bold">
            <span className="text-white">Job</span><span className="text-indigo-400">Fit</span><span className="text-white">.ai</span>
          </button>
          <button onClick={() => navigate('/dashboard')}
            className="text-sm text-slate-400 hover:text-white border border-white/10 px-4 py-1.5 rounded-lg transition-all">
            ← Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="font-display text-3xl font-bold text-white mb-2">Mock Interview</h2>
        <p className="text-slate-400 mb-8">Practice with AI — voice-based interview with real grading</p>

        {/* Setup Phase */}
        {phase === 'setup' && (
          <div className="bg-[#17171f] border border-white/5 rounded-2xl p-8 space-y-5">
            <div className="text-center mb-6">
              <div className="text-6xl mb-3">🎤</div>
              <p className="text-slate-400 text-sm">5 questions · 2 minutes each · AI graded</p>
            </div>

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
                  placeholder="e.g. SDE Intern at Google"
                  className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 placeholder-slate-600" />
              </div>
            </div>

            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4">
              <p className="text-indigo-300 text-sm font-medium mb-2">📋 How it works</p>
              <ul className="text-slate-400 text-xs space-y-1">
                <li>→ 5 AI-generated questions based on your resume</li>
                <li>→ Click the mic button and speak your answer (or type)</li>
                <li>→ 2 minutes per question</li>
                <li>→ AI grades each answer and gives detailed feedback</li>
              </ul>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>}

            <button onClick={startInterview} disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-colors font-display text-lg">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                  Preparing questions...
                </span>
              ) : '🎤 Start Mock Interview'}
            </button>
          </div>
        )}

        {/* Interview Phase */}
        {phase === 'interview' && questions.length > 0 && (
          <div className="space-y-4">
            {/* Progress */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Question {currentQ + 1} of {questions.length}</span>
              <span className={`font-display text-lg font-bold ${timeLeft < 30 ? 'text-red-400' : 'text-indigo-400'}`}>
                ⏱ {formatTime(timeLeft)}
              </span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-6">
              <div className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${((currentQ) / questions.length) * 100}%` }} />
            </div>

            {/* Question Card */}
            <div className="bg-[#17171f] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                  {questions[currentQ].category}
                </span>
                <span className="text-xs text-slate-500">{questions[currentQ].difficulty}</span>
              </div>
              <p className="text-white text-lg font-medium leading-relaxed">
                {questions[currentQ].question}
              </p>
            </div>

            {/* Answer Area */}
            <div className="bg-[#17171f] border border-white/5 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-sm">Your answer</p>
                <button
                  onClick={listening ? stopListening : startListening}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    listening
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                      : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30'
                  }`}
                >
                  {listening ? '⏹ Stop Recording' : '🎤 Start Speaking'}
                </button>
              </div>

              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={5}
                placeholder="Your spoken answer will appear here, or type your answer..."
                className="w-full bg-[#0f0f13] border border-white/8 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 resize-none placeholder-slate-600"
              />

              {listening && (
                <div className="flex items-center gap-2 text-red-400 text-xs">
                  <span className="animate-pulse w-2 h-2 bg-red-400 rounded-full" />
                  Recording... speak clearly
                </div>
              )}

              <button onClick={submitAnswer}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors font-display">
                {currentQ < questions.length - 1 ? 'Submit & Next Question →' : 'Submit & Finish Interview 🎯'}
              </button>
            </div>
          </div>
        )}

        {/* Grading Phase */}
        {phase === 'grading' && (
          <div className="bg-[#17171f] border border-white/5 rounded-2xl p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-400 rounded-full mx-auto mb-6" />
            <h3 className="font-display text-white text-xl font-semibold mb-2">Grading your interview...</h3>
            <p className="text-slate-400 text-sm">AI is analyzing each of your answers</p>
          </div>
        )}

        {/* Report Phase */}
        {phase === 'report' && report && (
          <div className="space-y-4">
            {/* Score Banner */}
            <div className="bg-[#17171f] border border-white/5 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
              <div className="text-center">
                <div className={`font-display text-7xl font-bold ${report.overall_score >= 80 ? 'text-green-400' : report.overall_score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {report.overall_score}
                </div>
                <div className="text-slate-400 text-sm">out of 100</div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-display text-white text-2xl font-bold">Grade {report.overall_grade}</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{report.summary}</p>
              </div>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#17171f] border border-white/5 rounded-2xl p-5">
                <h3 className="font-display text-white font-semibold mb-3">💪 Strengths</h3>
                <ul className="space-y-2">
                  {(report.strengths || []).map((s, i) => (
                    <li key={i} className="text-sm text-slate-300 flex gap-2">
                      <span className="text-green-400">→</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#17171f] border border-white/5 rounded-2xl p-5">
                <h3 className="font-display text-white font-semibold mb-3">📈 To Improve</h3>
                <ul className="space-y-2">
                  {(report.improvements || []).map((s, i) => (
                    <li key={i} className="text-sm text-slate-300 flex gap-2">
                      <span className="text-yellow-400">→</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Per-Answer Breakdown */}
            <div className="bg-[#17171f] border border-white/5 rounded-2xl p-6">
              <h3 className="font-display text-white font-semibold mb-4">📋 Answer Breakdown</h3>
              <div className="space-y-4">
                {(report.answers || []).map((a, i) => (
                  <div key={i} className="bg-[#0f0f13] rounded-xl p-4 border border-white/5">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-white text-sm font-medium flex-1 pr-4">{a.question}</p>
                      <span className={`font-display text-lg font-bold flex-shrink-0 ${a.score >= 8 ? 'text-green-400' : a.score >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {a.score}/10
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mb-2">{a.feedback}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-2">
                        <p className="text-green-400 mb-1">✓ Good</p>
                        <p className="text-slate-300">{a.what_was_good}</p>
                      </div>
                      <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-2">
                        <p className="text-yellow-400 mb-1">↑ Improve</p>
                        <p className="text-slate-300">{a.what_to_improve}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => { setPhase('setup'); setReport(null); setAnswers([]); setQuestions([]); }}
                className="bg-[#17171f] hover:bg-[#1e1e2e] border border-white/10 text-white font-semibold py-3 rounded-xl transition-colors font-display">
                🔄 Try Again
              </button>
              <button onClick={() => navigate('/dashboard')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-colors font-display">
                ← Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
