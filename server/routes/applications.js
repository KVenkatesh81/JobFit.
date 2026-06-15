const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Application = require('../models/Application');

// POST /api/applications — track an application
router.post('/', auth, async (req, res) => {
  try {
    const { jobId, status, notes } = req.body;
    const existing = await Application.findOne({ user: req.user._id, job: jobId });
    if (existing) {
      existing.status = status || existing.status;
      existing.notes = notes || existing.notes;
      await existing.save();
      return res.json({ application: existing });
    }
    const application = await Application.create({
      user: req.user._id,
      job: jobId,
      status: status || 'Applied',
      notes: notes || '',
    });
    res.status(201).json({ application });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/applications — get all applications for current user
router.get('/', auth, async (req, res) => {
  try {
    const applications = await Application.find({ user: req.user._id })
      .populate('job', 'title company location type deadline')
      .sort({ updatedAt: -1 });
    res.json({ applications });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/applications/:id — update status
router.patch('/:id', auth, async (req, res) => {
  try {
    const app = await Application.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status: req.body.status, notes: req.body.notes },
      { new: true }
    );
    if (!app) return res.status(404).json({ message: 'Application not found' });
    res.json({ application: app });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/applications/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Application.deleteOne({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Removed from tracker' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
