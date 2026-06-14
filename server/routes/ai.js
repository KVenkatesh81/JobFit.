const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Resume = require('../models/Resume');
const { askGroq } = require('../utils/groq');

// POST /api/ai/ats-score
router.post('/ats-score', auth, async (req, res) => {
  try {
    const { resumeId, jobDescription } = req.body;
    if (!resumeId) return res.status(400).json({ message: 'resumeId required' });

    const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (!resume.extractedText || resume.extractedText.trim().length < 50)
      return res.status(400).json({ message: 'Resume text too short or not extracted. Please upload a text-based PDF.' });

    const jdSection = jobDescription
      ? `Job Description:\n${jobDescription}\n\n`
      : '';

    const prompt = `You are an expert ATS (Applicant Tracking System) analyzer.

${jdSection}Resume Text:
${resume.extractedText.slice(0, 4000)}

Analyze this resume and return ONLY a valid JSON object with this exact structure:
{
  "score": <number 0-100>,
  "grade": "<A/B/C/D/F>",
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "keywords_found": ["<keyword1>", "<keyword2>", "<keyword3>", "<keyword4>", "<keyword5>"],
  "keywords_missing": ["<keyword1>", "<keyword2>", "<keyword3>"],
  "sections": {
    "contact": <true/false>,
    "summary": <true/false>,
    "experience": <true/false>,
    "education": <true/false>,
    "skills": <true/false>,
    "projects": <true/false>
  }
}
Return ONLY the JSON, no explanation, no markdown.`;

    const raw = await askGroq(prompt);
    const clean = raw.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(clean);

    // Save score to resume
    resume.atsScore = analysis.score;
    resume.analysis = analysis;
    await resume.save();

    res.json({ analysis });
  } catch (err) {
    console.error('ATS error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/ai/optimize
router.post('/optimize', auth, async (req, res) => {
  try {
    const { resumeId, jobDescription } = req.body;
    if (!resumeId) return res.status(400).json({ message: 'resumeId required' });

    const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (!resume.extractedText || resume.extractedText.trim().length < 50)
      return res.status(400).json({ message: 'Resume text too short or not extracted.' });

    const jdSection = jobDescription
      ? `Target Job Description:\n${jobDescription}\n\n`
      : '';

    const prompt = `You are an expert resume coach helping candidates land jobs at top tech companies.

${jdSection}Resume Text:
${resume.extractedText.slice(0, 4000)}

Provide detailed resume optimization suggestions. Return ONLY a valid JSON object:
{
  "overall_tip": "<one powerful overall tip>",
  "suggestions": [
    {
      "section": "<section name>",
      "issue": "<what is wrong>",
      "fix": "<specific actionable fix>",
      "priority": "<high/medium/low>"
    }
  ],
  "bullet_rewrites": [
    {
      "original": "<original bullet point from resume>",
      "improved": "<improved version with metrics and action verbs>"
    }
  ],
  "keywords_to_add": ["<keyword1>", "<keyword2>", "<keyword3>", "<keyword4>", "<keyword5>"],
  "format_tips": ["<tip1>", "<tip2>", "<tip3>"]
}
Return ONLY the JSON, no explanation, no markdown.`;

    const raw = await askGroq(prompt, 3000);
    const clean = raw.replace(/```json|```/g, '').trim();
    const optimization = JSON.parse(clean);

    res.json({ optimization });
  } catch (err) {
    console.error('Optimize error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

// POST /api/ai/skill-gap
router.post('/skill-gap', auth, async (req, res) => {
  try {
    const { resumeId, jobDescription, targetRole } = req.body;
    if (!resumeId) return res.status(400).json({ message: 'resumeId required' });

    const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (!resume.extractedText || resume.extractedText.trim().length < 50)
      return res.status(400).json({ message: 'Resume text not extracted. Please re-upload.' });

    const prompt = `You are a senior tech recruiter and career coach.

Resume:
${resume.extractedText.slice(0, 4000)}

Target Role: ${targetRole || 'Software Engineer'}
${jobDescription ? `Job Description:\n${jobDescription}` : ''}

Analyze the skill gap and return ONLY a valid JSON object:
{
  "current_level": "<Junior/Mid/Senior>",
  "target_role": "<role name>",
  "match_percentage": <number 0-100>,
  "strong_skills": ["<skill1>", "<skill2>", "<skill3>", "<skill4>", "<skill5>"],
  "missing_skills": [
    { "skill": "<skill name>", "priority": "<high/medium/low>", "reason": "<why needed>", "learn_time": "<e.g. 2 weeks>" }
  ],
  "learning_path": [
    { "step": <number>, "title": "<title>", "description": "<what to do>", "resources": ["<resource1>", "<resource2>"] }
  ],
  "timeline": "<e.g. 3 months to be job ready>",
  "summary": "<2-3 sentence assessment>"
}
Return ONLY the JSON, no explanation, no markdown.`;

    const raw = await askGroq(prompt);
    const clean = raw.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(clean);
    res.json({ analysis });
  } catch (err) {
    console.error('Skill gap error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/ai/interview-questions
router.post('/interview-questions', auth, async (req, res) => {
  try {
    const { resumeId, jobDescription, targetRole, difficulty } = req.body;
    if (!resumeId) return res.status(400).json({ message: 'resumeId required' });

    const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (!resume.extractedText || resume.extractedText.trim().length < 50)
      return res.status(400).json({ message: 'Resume text not extracted. Please re-upload.' });

    const prompt = `You are a senior technical interviewer at a top tech company.

Resume:
${resume.extractedText.slice(0, 4000)}

Target Role: ${targetRole || 'Software Engineer'}
Difficulty: ${difficulty || 'Medium'}
${jobDescription ? `Job Description:\n${jobDescription}` : ''}

Generate interview questions based on this resume. Return ONLY a valid JSON object:
{
  "candidate_name": "<name from resume if found>",
  "target_role": "<role>",
  "questions": [
    {
      "id": <number>,
      "category": "<Technical/Behavioral/HR/System Design>",
      "difficulty": "<Easy/Medium/Hard>",
      "question": "<the question>",
      "why_asked": "<why interviewer asks this>",
      "ideal_answer": "<what a good answer looks like>",
      "follow_ups": ["<follow up question 1>", "<follow up question 2>"]
    }
  ]
}
Generate exactly 10 questions: 4 technical, 3 behavioral, 2 HR, 1 system design.
Return ONLY the JSON, no explanation, no markdown.`;

    const raw = await askGroq(prompt, 3000);
    const clean = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);
    res.json({ result });
  } catch (err) {
    console.error('Interview questions error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/ai/grade-interview
router.post('/grade-interview', auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: 'prompt required' });
    const raw = await askGroq(prompt, 3000);
    const clean = raw.replace(/```json|```/g, '').trim();
    const report = JSON.parse(clean);
    res.json({ report });
  } catch (err) {
    console.error('Grade interview error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/ai/cover-letter
router.post('/cover-letter', auth, async (req, res) => {
  try {
    const { resumeId, jobDescription, companyName, jobTitle, tone } = req.body;
    if (!resumeId) return res.status(400).json({ message: 'resumeId required' });

    const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (!resume.extractedText || resume.extractedText.trim().length < 50)
      return res.status(400).json({ message: 'Resume text not extracted. Please re-upload.' });

    const prompt = `You are an expert cover letter writer who helps candidates land jobs at top companies.

Resume:
${resume.extractedText.slice(0, 4000)}

Company: ${companyName || 'the company'}
Job Title: ${jobTitle || 'Software Engineer'}
Tone: ${tone || 'Professional'}
${jobDescription ? `Job Description:\n${jobDescription}` : ''}

Write a compelling cover letter AND analyze the job description. Return ONLY valid JSON:
{
  "cover_letter": "<full cover letter text with proper paragraphs using \\n for line breaks>",
  "word_count": <number>,
  "highlights": ["<key strength highlighted 1>", "<key strength highlighted 2>", "<key strength highlighted 3>"],
  "jd_analysis": {
    "required_skills": ["<skill1>", "<skill2>", "<skill3>", "<skill4>"],
    "nice_to_have": ["<skill1>", "<skill2>"],
    "experience_level": "<Junior/Mid/Senior>",
    "key_responsibilities": ["<resp1>", "<resp2>", "<resp3>"],
    "culture_keywords": ["<keyword1>", "<keyword2>", "<keyword3>"],
    "red_flags": ["<any concern or unclear requirement>"],
    "match_score": <0-100>,
    "apply_recommendation": "<Strong Yes / Yes / Maybe / No>",
    "recommendation_reason": "<why>"
  }
}
Return ONLY the JSON, no explanation, no markdown.`;

    const raw = await askGroq(prompt, 3000);
    const clean = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);
    res.json({ result });
  } catch (err) {
    console.error('Cover letter error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/ai/company-match
router.post('/company-match', auth, async (req, res) => {
  try {
    const { resumeId, preferences } = req.body;
    if (!resumeId) return res.status(400).json({ message: 'resumeId required' });

    const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (!resume.extractedText || resume.extractedText.trim().length < 50)
      return res.status(400).json({ message: 'Resume text not extracted. Please re-upload.' });

    const prompt = `You are a senior tech recruiter who knows the hiring landscape deeply.

Resume:
${resume.extractedText.slice(0, 4000)}

Candidate Preferences: ${preferences || 'Open to all opportunities'}

Based on this resume, suggest the best matching companies AND a career path. Return ONLY valid JSON:
{
  "profile_summary": "<2 sentence summary of candidate profile>",
  "companies": [
    {
      "name": "<company name>",
      "type": "<FAANG/Startup/MNC/Product/Service>",
      "match_score": <0-100>,
      "why_match": "<why this company fits>",
      "roles": ["<role1>", "<role2>"],
      "difficulty": "<Easy/Medium/Hard to get in>",
      "prep_tip": "<specific tip to get into this company>",
      "known_for": "<what company is known for>"
    }
  ],
  "career_paths": [
    {
      "path": "<e.g. Frontend Specialist>",
      "timeline": "<e.g. 2 years>",
      "steps": ["<step1>", "<step2>", "<step3>"],
      "end_role": "<e.g. Senior Frontend Engineer>",
      "avg_salary": "<e.g. $120k-$150k>",
      "demand": "<High/Medium/Low>"
    }
  ],
  "immediate_actions": ["<action1>", "<action2>", "<action3>"]
}
Suggest exactly 6 companies and 3 career paths. Return ONLY the JSON.`;

    const raw = await askGroq(prompt, 3000);
    const clean = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);
    res.json({ result });
  } catch (err) {
    console.error('Company match error:', err.message);
    res.status(500).json({ message: err.message });
  }
});
