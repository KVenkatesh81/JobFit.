const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Resume = require('../models/Resume');
const { askGroq } = require('../utils/groq');
const { requiresDSA, getDSAContext } = require('../utils/roleUtils');
const HRBank = require('../models/HRBank');
const TechBank = require('../models/TechBank');

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

    const prompt = `You are a STRICT ATS analyzer and resume expert. Be harsh and honest — do NOT give inflated scores. Go through the resume line by line. CRITICAL: Before claiming any section is missing, weak, or irrelevant, verify it against the actual text provided — if Projects, Skills, or any section clearly exists in the text, do not claim otherwise. Base every observation strictly on the literal text given, not assumptions. Flag EVERY genuine spelling mistake, EVERY spacing inconsistency (double spaces, missing spaces around punctuation, inconsistent spacing between sections or bullets), and EVERY formatting inconsistency. For each issue, you MUST specify exactly which section and which line/bullet it occurs in — vague answers are not acceptable. IMPORTANT: If you see multiple real words merged together with no space (e.g. "IndianInstituteofTechnology" or "BachelorofTechnology"), this is a PDF text-extraction artifact, NOT a spelling mistake — do not list these as spelling mistakes. Only flag actual misspelled words (wrong letters), not missing spaces between otherwise correctly-spelled words.

${jdSection}Target Role: ${targetRole || 'Software Engineer'}
DSA/CP Relevance: ${dsaContext.instruction}

Resume Text:
${resume.extractedText.slice(0, 4000)}

Analyze STRICTLY and return ONLY valid JSON:
{
  "score": <0-100, be strict - average resumes score 40-60>,
  "grade": "<A/B/C/D/F>",
  "summary": "<2-3 sentence honest assessment>",
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "weaknesses": ["<weakness1>", "<weakness2>", "<weakness3>"],
  "spelling_mistakes": [
    { "wrong": "<misspelled word>", "correct": "<correct spelling>", "context": "<full sentence or line where it appears, quoted exactly>", "section": "<which resume section this is in, e.g. Experience, Projects, Education>" }
  ],
  "formatting_issues": [
    { "issue": "<specific formatting issue>", "location": "<exact section and line/bullet where this occurs, be specific e.g. 'Projects section, 2nd bullet under JobFit.ai'>", "fix": "<how to fix it>" }
  ],
  "spacing_issues": [
    { "issue": "<e.g. inconsistent spacing between bullet points, extra space before comma, missing space after period>", "location": "<exact section and line where this occurs>" }
  ],
  "what_to_make_bold": ["<text that should be bolded>"],
  ${dsaContext.needed ? `"dsa_cp_feedback": "<specific feedback on DSA/CP presence>",` : `"dsa_cp_feedback": null,`}
  "keywords_found": ["<keyword1>", "<keyword2>", "<keyword3>"],
  "keywords_missing": ["<keyword1>", "<keyword2>", "<keyword3>"],
  "sections": {
    "contact": true,
    "summary": true,
    "experience": true,
    "education": true,
    "skills": true,
    "projects": true
    ${dsaContext.needed ? `, "dsa_cp": true` : ''}
  },
  "priority_fixes": ["<fix1>", "<fix2>", "<fix3>"],
  "writeup": [
    "<one clear plain-English bullet point describing a specific mistake or fix, written the way a human reviewer would explain it to the candidate directly, mention exact section/line where relevant>"
  ]
}
Generate at least 8-12 writeup bullets covering every spelling mistake, spacing issue, formatting issue, and key suggestion found, written in clear plain English as if explaining directly to the candidate. Return ONLY the JSON.`;

    const raw = await askGroq(prompt);
    const clean = raw.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(clean);
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

CRITICAL RULE: Base every single observation strictly on the EXACT text provided below. Before writing any "issue" for a section, you MUST first locate and quote the actual current_content from that section in the resume text. If the section already does what a generic checklist would suggest (e.g. skills are already categorized with labels like "Frontend:", "Backend:", "Database:" or coursework already lists software-engineering-relevant courses), then either skip critiquing that section entirely or give a more nuanced, specific critique — do NOT repeat generic templated advice like "categorize your skills" if they are visibly already categorized in the text. Read the actual resume text fully before generating each suggestion.

${jdSection}Target Role: ${targetRole || 'Software Engineer'}
DSA/CP Relevance: ${dsaContext.instruction}

Resume Text (this is the COMPLETE and ONLY source of truth — read it fully before responding):
${resume.extractedText.slice(0, 4000)}

Return ONLY valid JSON:
{
  "overall_tip": "<one powerful overall tip>",
  "spelling_corrections": [
    { "wrong": "<wrong>", "correct": "<correct>", "context": "<where it appears>" }
  ],
  "suggestions": [
    { "section": "<section name>", "current_content": "<quote the actual relevant text from that section as it appears in the resume>", "issue": "<specific issue based on what is actually there>", "fix": "<exact actionable fix>", "priority": "<high/medium/low>" }
  ],
  "bullet_rewrites": [
    { "original": "<original bullet>", "improved": "<improved with metrics and strong action verbs>", "why": "<why this is better>" }
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
  "ats_score_after_fixes": 75,
  "writeup": [
    "<one clear plain-English bullet point describing a specific optimization suggestion, written the way a human reviewer would explain it directly to the candidate>"
  ]
}
Generate at least 8-12 writeup bullets covering every suggestion, bullet rewrite, bold recommendation, and keyword gap, written in clear plain English. Return ONLY the JSON.`;

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
  "match_percentage": 65,
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
    { "step": 1, "title": "<title>", "description": "<what to do>", "resources": ["<resource1>"] }
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
    { "round": "<round name>", "type": "<type>", "duration": "<duration>", "description": "<what happens>" }
  ],
  "questions": [
    {
      "id": 1,
      "category": "<category>",
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
  "cover_letter": "<full cover letter with newlines>",
  "word_count": 250,
  "highlights": ["<key strength1>", "<key strength2>", "<key strength3>"],
  "jd_analysis": {
    "required_skills": ["<skill1>", "<skill2>", "<skill3>"],
    "nice_to_have": ["<skill1>", "<skill2>"],
    "experience_level": "<Junior/Mid/Senior>",
    "key_responsibilities": ["<resp1>", "<resp2>", "<resp3>"],
    "culture_keywords": ["<keyword1>", "<keyword2>"],
    "red_flags": ["<concern1>"],
    "match_score": 70,
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
      "match_score": 75,
      "why_match": "<why this fits>",
      "roles": ["<role1>", "<role2>"],
      "difficulty": "<Easy/Medium/Hard to get in>",
      "interview_process": {
        "total_rounds": 4,
        "rounds": [
          {
            "round_number": 1,
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
    const { resumeId, targetRole, targetCompany, refresh } = req.body;
    if (!resumeId) return res.status(400).json({ message: 'resumeId required' });

    const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (!resume.extractedText || resume.extractedText.trim().length < 50)
      return res.status(400).json({ message: 'Resume text not extracted.' });

    if (!refresh) {
      const cached = await HRBank.findOne({ user: req.user._id, resume: resumeId, targetRole: targetRole || '' });
      if (cached && cached.questions.length >= 50) {
        return res.json({ result: { questions: cached.questions } });
      }
    }

    const categories = [
      'Introduction & Background', 'Strengths & Weaknesses', 'Career Goals',
      'Situational & Behavioral', 'Company & Role Fit', 'Teamwork & Conflict',
      'Salary & Negotiation', 'Failure & Learning', 'Leadership', 'Stress & Pressure',
    ];

    let allQuestions = [];
    for (let i = 0; i < categories.length; i += 2) {
      const batch = categories.slice(i, i + 2);
      const prompt = `You are an experienced HR interviewer. Generate HR questions personalized to this candidate's resume.

Resume:
${resume.extractedText.slice(0, 3500)}

Target Role: ${targetRole || 'Software Engineer'}
Target Company: ${targetCompany || 'a top tech company'}
Categories to cover: ${batch.join(', ')}

Return ONLY valid JSON:
{
  "questions": [
    {
      "category": "<one of: ${batch.join(' or ')}>",
      "question": "<personalized HR question>",
      "what_they_check": "<what interviewer evaluates>",
      "ideal_answer_structure": "<how to structure answer, e.g. STAR method>",
      "sample_answer": "<strong sample answer for this candidate>",
      "mistakes_to_avoid": "<common mistakes>"
    }
  ]
}
Generate exactly 10 questions (5 per category). Return ONLY the JSON.`;

      try {
        const raw = await askGroq(prompt, 3000);
        const clean = raw.replace(/```json|```/g, '').trim();
        const batchResult = JSON.parse(clean);
        allQuestions = allQuestions.concat(batchResult.questions || []);
      } catch (err) {
        console.error('Batch failed:', err.message);
      }
    }

    allQuestions = allQuestions.map((q, i) => Object.assign({}, q, { id: i + 1 }));

    await HRBank.findOneAndUpdate(
      { user: req.user._id, resume: resumeId, targetRole: targetRole || '' },
      { questions: allQuestions },
      { upsert: true }
    );

    res.json({ result: { questions: allQuestions } });
  } catch (err) {
    console.error('HR questions error:', err.message);
    res.status(500).json({ message: err.message });
  }
});


// POST /api/ai/tech-questions
router.post('/tech-questions', auth, async (req, res) => {
  try {
    const { resumeId, targetRole, refresh } = req.body;
    if (!resumeId) return res.status(400).json({ message: 'resumeId required' });

    const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    if (!resume.extractedText || resume.extractedText.trim().length < 50)
      return res.status(400).json({ message: 'Resume text not extracted.' });

    if (!refresh) {
      const cached = await TechBank.findOne({ user: req.user._id, resume: resumeId, targetRole: targetRole || '' });
      if (cached && cached.questions.length >= 50) {
        return res.json({ result: { questions: cached.questions, tips: cached.tips } });
      }
    }

    const dsaContext = getDSAContext(targetRole);

    const batches = dsaContext.needed
      ? [
          { label: 'Projects mentioned in resume', count: 15 },
          { label: 'Programming languages and frameworks listed', count: 15 },
          { label: 'Data Structures and Algorithms basics relevant to skill level', count: 10 },
          { label: 'System design and architecture basics', count: 5 },
          { label: 'Databases and tools mentioned', count: 5 },
        ]
      : [
          { label: 'Projects mentioned in resume', count: 18 },
          { label: 'Tools, software and frameworks listed', count: 18 },
          { label: 'Role-specific concepts and processes', count: 9 },
          { label: 'Domain knowledge relevant to the role', count: 5 },
        ];

    let allQuestions = [];
    for (const batch of batches) {
      const alreadyAsked = allQuestions.map(q => q.question).slice(0, 30).join(' | ');
      const prompt = `You are a senior technical interviewer. Generate questions STRICTLY based on what is mentioned in this resume. Do NOT invent technologies not present in the resume.

Resume:
${resume.extractedText.slice(0, 3500)}

Target Role: ${targetRole || 'Software Engineer'}
Focus area: ${batch.label}
DSA/CP Relevance: ${dsaContext.instruction}
${alreadyAsked ? `Questions already asked in other rounds (do NOT repeat these or close variations of them): ${alreadyAsked}` : ''}

Return ONLY valid JSON:
{
  "questions": [
    {
      "question": "<technical question based on resume content>",
      "topic": "<specific technology/project/concept this targets>",
      "difficulty": "<Easy/Medium/Hard>",
      "resume_reference": "<which part of resume this is based on>",
      "ideal_answer": "<a strong, specific answer>",
      "follow_up": "<one likely follow-up question>"
    }
  ]
}
Generate exactly ${batch.count} questions for this focus area. Return ONLY the JSON.`;

      try {
        const raw = await askGroq(prompt, 3000);
        const clean = raw.replace(/```json|```/g, '').trim();
        const batchResult = JSON.parse(clean);
        const tagged = (batchResult.questions || []).map(q => ({ ...q, category: batch.label }));
        allQuestions = allQuestions.concat(tagged);
      } catch (err) {
        console.error('Tech batch failed:', err.message);
      }
    }

    // Deduplicate questions by similarity (same topic + similar question text)
    const seen = new Set();
    allQuestions = allQuestions.filter(q => {
      const key = (q.topic + '|' + q.question.toLowerCase().slice(0, 60)).replace(/[^a-z0-9|]/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    allQuestions = allQuestions.map((q, i) => Object.assign({}, q, { id: i + 1 }));

    // Generate interview tips separately
    const tipsPrompt = `You are a senior technical interview coach. Based on this resume and target role, give specific preparation tips.

Resume:
${resume.extractedText.slice(0, 3000)}

Target Role: ${targetRole || 'Software Engineer'}
DSA/CP Relevance: ${dsaContext.instruction}

Return ONLY valid JSON:
{
  "tips": [
    { "category": "<e.g. Before the Interview>", "tip": "<specific actionable tip>" }
  ]
}
Generate exactly 10 tips covering: resume walkthrough prep, project deep-dive prep, weak areas to shore up, common mistakes to avoid, how to handle questions you don't know, communication tips, and time management during the interview. Return ONLY the JSON.`;

    let tips = [];
    try {
      const rawTips = await askGroq(tipsPrompt, 2000);
      const cleanTips = rawTips.replace(/```json|```/g, '').trim();
      const tipsResult = JSON.parse(cleanTips);
      tips = tipsResult.tips || [];
    } catch (err) {
      console.error('Tips generation failed:', err.message);
    }

    await TechBank.findOneAndUpdate(
      { user: req.user._id, resume: resumeId, targetRole: targetRole || '' },
      { questions: allQuestions, tips },
      { upsert: true }
    );

    res.json({ result: { questions: allQuestions, tips } });
  } catch (err) {
    console.error('Tech questions error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
