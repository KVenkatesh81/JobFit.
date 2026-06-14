const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
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

module.exports = router;
