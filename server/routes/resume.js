const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { upload, cloudinary } = require('../config/cloudinary');
const Resume = require('../models/Resume');
const { extractText } = require('../utils/textExtractor');

router.post('/upload', auth, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const fileUrl = req.file.path;
    const originalName = req.file.originalname || '';
    const ext = originalName.split('.').pop().toLowerCase();
    const fileType = ext === 'pdf' ? 'pdf' : 'docx';
    const extractedText = await extractText(fileUrl, fileType);

    const resume = await Resume.create({
      user: req.user._id,
      filename: originalName,
      fileUrl,
      fileType,
      extractedText,
    });

    res.status(201).json({ message: 'Resume uploaded', resume });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ resumes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/resume/view/:id — get viewable URL
router.get('/view/:id', auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    // Convert raw cloudinary URL to viewable URL
    let viewUrl = resume.fileUrl;
    if (resume.fileType === 'pdf') {
      // Replace /raw/upload/ with /image/upload/ and add .pdf extension for inline viewing
      viewUrl = resume.fileUrl.replace('/raw/upload/', '/image/upload/') + '.pdf';
    }

    res.json({ viewUrl, filename: resume.filename, fileType: resume.fileType });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
