const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Resume = require('../models/Resume');
const { askGroq } = require('../utils/groq');
const { requiresDSA, getDSAContext } = require('../utils/roleUtils');

// POST /api/ai/ats-score
router.post('/ats-score', auth, async (req, res) => {
  try {
    const { resumeId, jobDescription, targetRole } = req.body;
    if (!resumeId) return res.status(400).json({ message: 'resumeId required' });

    const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (!resume.extractedText || resume.extractedText.trim().length < 50)
      return res.status(400).json({ message: 'Resume text too short or not extracted.' });

    const dsaContext = getDSAContext(targetRole);
    const jdSection = jobDescription ? `Job Description:\n${jobDescription}\n\n` : '';

    const prompt = `You are a STRICT ATS analyzer and resume expert. Be harsh and honest — do NOT give inflated scores.

${jdSection}Target Role: ${targetRole || 'Software Engineer'}
DSA/CP Relevance: ${dsaContext.instruction}

Resume Text:
${resume.extractedText.slice(0, 4000)}

Analyze STRICTLY and return ONLY valid JSON:
{
  "score": <0-100, be strict — average resumes score 40-60>,
  "grade": "<A/B/C/D/F>",
  "summary": "<2-3 sentence honest assessment>",
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "weaknesses": ["<weakness1>", "<weakness2>", "<weakness3>"],
  "spelling_mistakes": [
    { "wrong": "<misspelled word>", "correct": "<correct spelling>", "context": "<sentence where it appears>" }
  ],
  "formatting_issues": [
    "<specific formatting issue found>"
  ],
  "what_to_make_bold": ["<text that should be bolded>"],
  ${dsaContext.needed ? `"dsa_cp_feedback": "<specific feedback on DSA/CP presence — is Codeforces/LeetCode rating mentioned? If missing, say it clearly>",` : `"dsa_cp_feedback": null,`}
  "keywords_found": ["<keyword1>", "<keyword2>", "<keyword3>"],
  "keywords_missing": ["<keyword1>", "<keyword2>", "<keyword3>"],
  "sections": {
    "contact": <true/false>,
    "summary": <true/false>,
    "experience": <true/false>,
    "education": <true/false>,
    "skills": <true/false>,
    "projects": <true/false>
    ${dsaContext.needed ? `, "dsa_cp": <true/false>` : ''}
  },
  "priority_fixes": ["<fix1>", "<fix2>", "<fix3>"]
}
Return ONLY the JSON.`;

    const raw = await askGroq(prompt);
    const clean = raw.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(clean);

    // attach role context to result
    analysis.dsa_relevant = dsaContext.needed;

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
    const { resumeId, jobDescription, targetRole } = req.body;
    if (!resumeId) return res.status(400).json({ message: 'resumeId required' });

    const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (!resume.extractedText || resume.extractedText.trim().length < 50)
      return res.status(400).json({ message: 'Resume text not extracted.' });

    const dsaContext = getDSAContext(targetRole);
    const jdSection = jobDescription ? `Target Job Description:\n${jobDescription}\n\n` : '';

    const prompt = `You are a strict resume coach helping a candidate land interviews.

${jdSection}Target Role: ${targetRole || 'Software Engineer'}
DSA/CP Relevance: ${dsaContext.instruction}

Resume Text:
${resume.extractedText.slice(0, 4000)}

Return ONLY valid JSON:
{
  "overall_tip": "<one powerful overall tip>",
  "spelling_corrections": [
    { "wrong": "<wrong>", "correct": "<correct>", "context": "<where it appears>" }
  ],
  "suggestions": [
    {
      "section": "<section name>",
      "issue": "<specific issue>",
      "fix": "<exact actionable fix>",
      "priority": "<high/medium/low>"
    }
  ],
  "bullet_rewrites": [
    {
      "original": "<original bullet>",
      "improved": "<improved with metrics and strong action verbs>",
      "why": "<why this is better>"
    }
  ],
  "bold_recommendations": ["<exact text to bold>"],
  "spacing_issues": ["<specific spacing problem>"],
  ${dsaContext.needed ? `"dsa_cp_recommendations": {
    "current_state": "<current DSA/CP info in resume>",
    "missing": "<what is missing>",
    "how_to_add": "<exactly how to add DSA/CP section>",
    "importance": "<why this matters for OAs>"
  },` : `"dsa_cp_recommendations": null,`}
  "keywords_to_add": ["<keyword1>", "<keyword2>", "<keyword3>"],
  "format_tips": ["<tip1>", "<tip2>", "<tip3>"],
  "ats_score_after_fixes": <estimated score after fixes, 0-100>
}
Return ONLY the JSON.`;

    const raw = await askGroq(prompt, 3000);
    const clean = raw.replace(/```json|```/g, '').trim();
    const optimization = JSON.parse(clean);
    optimization.dsa_relevant = dsaContext.needed;

    res.json({ optimization });
  } catch (err) {
    console.error('Optimize error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/ai/skill-gap
router.post('/skill-gap', auth, async (req, res) => {
  try {
    const { resumeId, jobDescription, targetRole } = req.body;
    if (!resumeId) return res.status(400).json({ message: 'resumeId required' });

    const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (!resume.extractedText || resume.extractedText.trim().length < 50)
      return res.status(400).json({ message: 'Resume text not extracted.' });

    const dsaContext = getDSAContext(targetRole);

    const prompt = `You are a senior tech recruiter who knows what companies look for.

Resume:
${resume.extractedText.slice(0, 4000)}

Target Role: ${targetRole || 'Software Engineer'}
DSA/CP Relevance: ${dsaContext.instruction}
${jobDescription ? `Job Description:\n${jobDescription}` : ''}

Return ONLY valid JSON:
{
  "current_level": "<Junior/Mid/Senior>",
  "target_role": "<role name>",
  "match_percentage": <0-100>,
  "strong_skills": ["<skill1>", "<skill2>", "<skill3>", "<skill4>", "<skill5>"],
  "missing_skills": [
    { "skill": "<skill>", "priority": "<high/medium/low>", "reason": "<why needed>", "learn_time": "<time>" }
  ],
  ${dsaContext.needed ? `"dsa_cp_status": {
    "current": "<current DSA/CP level from resume>",
    "required": "<what level needed for OAs>",
    "gap": "<specific gap>",
    "resources": ["<resource1>", "<resource2>"]
  },` : `"dsa_cp_status": null,`}
  "learning_path": [
    { "step": <number>, "title": "<title>", "description": "<what to do>", "resources": ["<resource1>"] }
  ],
  "timeline": "<time to be job ready>",
  "summary": "<2-3 sentence assessment>"
}
Return ONLY the JSON.`;

    const raw = await askGroq(prompt);
    const clean = raw.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(clean);
    analysis.dsa_relevant = dsaContext.needed;
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
      return res.status(400).json({ message: 'Resume text not extracted.' });

    const dsaContext = getDSAContext(targetRole);

    const questionBreakdown = dsaContext.needed
      ? '4 DSA/CP (based on resume skill level), 4 Technical (resume projects/stack only), 2 Behavioral, 2 HR'
      : '6 Technical (based ONLY on resume projects and tech stack), 3 Behavioral, 2 HR, 1 Role-specific';

    const prompt = `You are a senior interviewer. Generate questions STRICTLY based on what is mentioned in this resume. Do NOT ask about topics not present in the resume.

Resume:
${resume.extractedText.slice(0, 4000)}

Target Role: ${targetRole || 'Software Engineer'}
Difficulty: ${difficulty || 'Medium'}
DSA/CP Relevance: ${dsaContext.instruction}
${jobDescription ? `Job Description:\n${jobDescription}` : ''}

Question breakdown: ${questionBreakdown}

Return ONLY valid JSON:
{
  "candidate_name": "<name from resume>",
  "target_role": "<role>",
  "dsa_relevant": ${dsaContext.needed},
  "interview_rounds": [
    {
      "round": "<round name>",
      "type": "<type>",
      "duration": "<duration>",
      "description": "<what happens>"
    }
  ],
  "questions": [
    {
      "id": <number>,
      "category": "<${dsaContext.needed ? 'DSA/' : ''}Technical/Behavioral/HR>",
      "difficulty": "<Easy/Medium/Hard>",
      "question": "<question based on resume only>",
      "resume_reference": "<which resume section this comes from>",
      "why_asked": "<why asked>",
      "ideal_answer": "<good answer>",
      "follow_ups": ["<follow up1>", "<follow up2>"]
    }
  ]
}
Return ONLY the JSON.`;

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
      return res.status(400).json({ message: 'Resume text not extracted.' });

    const prompt = `You are an expert cover letter writer.

Resume:
${resume.extractedText.slice(0, 4000)}

Company: ${companyName || 'the company'}
Job Title: ${jobTitle || 'Software Engineer'}
Tone: ${tone || 'Professional'}
${jobDescription ? `Job Description:\n${jobDescription}` : ''}

Return ONLY valid JSON:
{
  "cover_letter": "<full cover letter with \\n for line breaks>",
  "word_count": <number>,
  "highlights": ["<key strength1>", "<key strength2>", "<key strength3>"],
  "jd_analysis": {
    "required_skills": ["<skill1>", "<skill2>", "<skill3>"],
    "nice_to_have": ["<skill1>", "<skill2>"],
    "experience_level": "<Junior/Mid/Senior>",
    "key_responsibilities": ["<resp1>", "<resp2>", "<resp3>"],
    "culture_keywords": ["<keyword1>", "<keyword2>"],
    "red_flags": ["<concern1>"],
    "match_score": <0-100>,
    "apply_recommendation": "<Strong Yes / Yes / Maybe / No>",
    "recommendation_reason": "<why>"
  }
}
Return ONLY the JSON.`;

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
    const { resumeId, preferences, targetRole } = req.body;
    if (!resumeId) return res.status(400).json({ message: 'resumeId required' });

    const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (!resume.extractedText || resume.extractedText.trim().length < 50)
      return res.status(400).json({ message: 'Resume text not extracted.' });

    const dsaContext = getDSAContext(targetRole);

    const prompt = `You are a senior tech recruiter who knows the hiring landscape deeply.

Resume:
${resume.extractedText.slice(0, 4000)}

Preferences: ${preferences || 'Open to all opportunities'}
DSA/CP Relevance: ${dsaContext.instruction}

Return ONLY valid JSON:
{
  "profile_summary": "<2 sentence summary>",
  "companies": [
    {
      "name": "<company>",
      "type": "<FAANG/Startup/MNC/Product/Service>",
      "match_score": <0-100>,
      "why_match": "<why this fits>",
      "roles": ["<role1>", "<role2>"],
      "difficulty": "<Easy/Medium/Hard to get in>",
      "interview_process": {
        "total_rounds": <number>,
        "rounds": [
          {
            "round_number": <number>,
            "name": "<round name>",
            "type": "<type>",
            "duration": "<duration>",
            "question_types": ["<type1>", "<type2>"],
            "hardness": "<Easy/Medium/Hard>",
            "topics": ["<topic1>", "<topic2>"],
            "tips": "<tip for this round>"
          }
        ],
        "oa_has_dsa": ${dsaContext.needed},
        "dsa_level_required": ${dsaContext.needed ? '"<required level>"' : 'null'}
      },
      "company_culture": "<2-3 sentences about culture>",
      "prep_tip": "<specific prep tip>",
      "known_for": "<what they are known for>"
    }
  ],
  "career_paths": [
    {
      "path": "<path name>",
      "timeline": "<timeline>",
      "steps": ["<step1>", "<step2>", "<step3>"],
      "end_role": "<end role>",
      "avg_salary": "<salary range>",
      "demand": "<High/Medium/Low>"
    }
  ],
  "immediate_actions": ["<action1>", "<action2>", "<action3>"]
}
Suggest 6 companies and 3 career paths. Return ONLY the JSON.`;

    const raw = await askGroq(prompt, 3000);
    const clean = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);
    res.json({ result });
  } catch (err) {
    console.error('Company match error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/ai/hr-questions
router.post('/hr-questions', auth, async (req, res) => {
  try {
    const { resumeId, targetRole, targetCompany } = req.body;
    if (!resumeId) return res.status(400).json({ message: 'resumeId required' });

    const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (!resume.extractedText || resume.extractedText.trim().length < 50)
      return res.status(400).json({ message: 'Resume text not extracted.' });

    const prompt = `You are an experienced HR interviewer. Generate HR questions personalized to this candidate.

Resume:
${resume.extractedText.slice(0, 4000)}

Target Role: ${targetRole || 'Software Engineer'}
Target Company: ${targetCompany || 'a top tech company'}

Return ONLY valid JSON:
{
  "questions": [
    {
      "id": <number>,
      "category": "<Introduction/Strengths/Weaknesses/Situational/Career Goals/Company Fit/Salary>",
      "question": "<HR question personalized to this resume>",
      "what_they_check": "<what interviewer evaluates>",
      "ideal_answer_structure": "<how to structure answer>",
      "sample_answer": "<strong sample answer for this candidate>",
      "mistakes_to_avoid": "<common mistakes>"
    }
  ]
}
Generate 15 personalized HR questions. Return ONLY the JSON.`;

    const raw = await askGroq(prompt, 3000);
    const clean = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);
    res.json({ result });
  } catch (err) {
    console.error('HR questions error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
