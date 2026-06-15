const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const VerifyRequest = require('../models/VerifyRequest');
const User = require('../models/User');
const Job = require('../models/Job');

// POST /api/verify/apply — user applies for verified
router.post('/apply', auth, async (req, res) => {
  try {
    const { reason, linkedin } = req.body;
    if (!reason) return res.status(400).json({ message: 'Please provide a reason' });

    const existing = await VerifyRequest.findOne({ user: req.user._id, status: 'pending' });
    if (existing) return res.status(400).json({ message: 'You already have a pending request' });

    if (req.user.role === 'verified')
      return res.status(400).json({ message: 'You are already verified' });

    const request = await VerifyRequest.create({
      user: req.user._id,
      reason,
      linkedin: linkedin || '',
    });
    res.status(201).json({ message: 'Verification request submitted', request });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/verify/status — check own verify status
router.get('/status', auth, async (req, res) => {
  try {
    const request = await VerifyRequest.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ request, role: req.user.role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---- ADMIN ROUTES ----
const adminOnly = (req, res, next) => {
  if (req.user.username !== process.env.ADMIN_USERNAME)
    return res.status(403).json({ message: 'Admin access only' });
  next();
};

// GET /api/verify/admin/requests — all pending requests
router.get('/admin/requests', auth, adminOnly, async (req, res) => {
  try {
    const requests = await VerifyRequest.find({ status: 'pending' })
      .populate('user', 'name username role createdAt')
      .sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/verify/admin/requests/:id — approve or reject
router.patch('/admin/requests/:id', auth, adminOnly, async (req, res) => {
  try {
    const { action, adminNote } = req.body;
    if (!['approved', 'rejected'].includes(action))
      return res.status(400).json({ message: 'Invalid action' });

    const request = await VerifyRequest.findById(req.params.id).populate('user');
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = action;
    request.adminNote = adminNote || '';
    await request.save();

    if (action === 'approved') {
      await User.findByIdAndUpdate(request.user._id, { role: 'verified' });
    }

    res.json({ message: `Request ${action}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/verify/admin/stats — dashboard stats
router.get('/admin/stats', auth, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ role: 'verified' });
    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ active: true });
    const pendingRequests = await VerifyRequest.countDocuments({ status: 'pending' });
    const bannedUsers = await User.countDocuments({ banned: true });
    res.json({ totalUsers, verifiedUsers, totalJobs, activeJobs, pendingRequests, bannedUsers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/verify/admin/users — all users
router.get('/admin/users', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/verify/admin/users/:id/ban — ban or unban
router.patch('/admin/users/:id/ban', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.banned = !user.banned;
    await user.save();
    res.json({ message: user.banned ? 'User banned' : 'User unbanned', banned: user.banned });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/verify/admin/jobs/:id/feature — feature or unfeature a job
router.patch('/admin/jobs/:id/feature', auth, adminOnly, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    job.featured = !job.featured;
    await job.save();
    res.json({ message: job.featured ? 'Job featured' : 'Job unfeatured', featured: job.featured });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/verify/admin/jobs/:id — admin delete any job
router.delete('/admin/jobs/:id', auth, adminOnly, async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/verify/admin/jobs — all jobs
router.get('/admin/jobs', auth, adminOnly, async (req, res) => {
  try {
    const jobs = await Job.find().populate('postedBy', 'name username').sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
