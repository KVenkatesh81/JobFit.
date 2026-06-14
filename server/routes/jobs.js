const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Resume = require('../models/Resume');
const { askGroq } = require('../utils/groq');

// GET /api/jobs — get all active jobs
router.get('/', auth, async (req, res) => {
  try {
    const jobs = await Job.find({ active: true, deadline: { $gte: new Date() } })
      .populate('postedBy', 'name username role')
      .sort({ featured: -1, createdAt: -1 });
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/jobs/:id — get single job + increment views
router.get('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('postedBy', 'name username role');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ job });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/jobs — post a job (verified only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'verified' && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Only verified users can post jobs' });
    if (req.user.banned)
      return res.status(403).json({ message: 'Your account has been banned' });

    const { title, company, location, type, salary, skills, description, applyLink, deadline } = req.body;
    if (!title || !company || !location || !description || !applyLink || !deadline)
      return res.status(400).json({ message: 'All required fields must be filled' });

    const job = await Job.create({
      postedBy: req.user._id,
      title, company, location, type, salary,
      skills: skills || [],
      description, applyLink,
      deadline: new Date(deadline),
    });

    res.status(201).json({ message: 'Job posted successfully', job });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/jobs/:id/apply-click — track apply button click
router.post('/:id/apply-click', auth, async (req, res) => {
  try {
    await Job.findByIdAndUpdate(req.params.id, { $inc: { applyClicks: 1 } });
    res.json({ message: 'tracked' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/jobs/:id/save — save or unsave a job
router.post('/:id/save', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const saved = job.savedBy.includes(req.user._id);
    if (saved) {
      job.savedBy.pull(req.user._id);
    } else {
      job.savedBy.push(req.user._id);
    }
    await job.save();
    res.json({ saved: !saved });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/jobs/saved/list — get saved jobs
router.get('/saved/list', auth, async (req, res) => {
  try {
    const jobs = await Job.find({ savedBy: req.user._id, active: true })
      .populate('postedBy', 'name username role')
      .sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/jobs/:id/match — AI match score
router.post('/:id/match', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const resume = await Resume.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (!resume || !resume.extractedText || resume.extractedText.length < 50)
      return res.status(400).json({ message: 'Please upload a resume first' });

    const prompt = `You are a recruiter analyzing resume-job fit.

Job Title: ${job.title}
Company: ${job.company}
Required Skills: ${job.skills.join(', ')}
Job Description: ${job.description}

Resume:
${resume.extractedText.slice(0, 3000)}

Return ONLY valid JSON:
{
  "match_score": <0-100>,
  "matching_skills": ["<skill1>", "<skill2>"],
  "missing_skills": ["<skill1>", "<skill2>"],
  "verdict": "<Strong Match / Good Match / Partial Match / Low Match>",
  "tip": "<one specific tip to improve chances>"
}`;

    const raw = await askGroq(prompt, 1000);
    const clean = raw.replace(/```json|```/g, '').trim();
    const match = JSON.parse(clean);
    res.json({ match });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/jobs/my/posts — get jobs posted by current user
router.get('/my/posts', auth, async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id }).sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/jobs/:id — delete own job post
router.delete('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, postedBy: req.user._id });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    await Job.deleteOne({ _id: req.params.id });
    res.json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
