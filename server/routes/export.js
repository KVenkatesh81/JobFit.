const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const Resume = require('../models/Resume');

router.post('/full-report', auth, async (req, res) => {
  try {
    const { resumeId } = req.body;
    const resume = await Resume.findOne({ _id: resumeId, user: req.user._id });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="JobFit_Report.pdf"`);
    doc.pipe(res);

    doc.fontSize(24).fillColor('#4f46e5').text('JobFit.ai', { align: 'center' });
    doc.fontSize(14).fillColor('#666').text('Resume Analysis Report', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(12).fillColor('#000');
    doc.text(`Resume: ${resume.filename}`);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`);
    doc.moveDown(1);

    if (resume.atsScore) {
      doc.fontSize(18).fillColor('#4f46e5').text(`ATS Score: ${resume.atsScore}/100`);
      doc.moveDown(1);
    }

    if (resume.analysis) {
      const a = resume.analysis;
      doc.fontSize(14).fillColor('#000').text('Summary', { underline: true });
      doc.fontSize(11).fillColor('#333').text(a.summary || 'N/A');
      doc.moveDown(1);

      if (a.strengths && a.strengths.length) {
        doc.fontSize(14).fillColor('#16a34a').text('Strengths', { underline: true });
        a.strengths.forEach(s => doc.fontSize(11).fillColor('#333').text('- ' + s));
        doc.moveDown(1);
      }

      if (a.weaknesses && a.weaknesses.length) {
        doc.fontSize(14).fillColor('#dc2626').text('Weaknesses', { underline: true });
        a.weaknesses.forEach(w => doc.fontSize(11).fillColor('#333').text('- ' + w));
        doc.moveDown(1);
      }

      if (a.spelling_mistakes && a.spelling_mistakes.length) {
        doc.fontSize(14).fillColor('#dc2626').text('Spelling Mistakes', { underline: true });
        a.spelling_mistakes.forEach(s => doc.fontSize(11).fillColor('#333').text('"' + s.wrong + '" -> "' + s.correct + '"'));
        doc.moveDown(1);
      }

      if (a.priority_fixes && a.priority_fixes.length) {
        doc.fontSize(14).fillColor('#ea580c').text('Priority Fixes', { underline: true });
        a.priority_fixes.forEach((f, i) => doc.fontSize(11).fillColor('#333').text((i + 1) + '. ' + f));
        doc.moveDown(1);
      }

      if (a.writeup && a.writeup.length) {
        doc.fontSize(14).fillColor('#4f46e5').text('Detailed Write-up', { underline: true });
        a.writeup.forEach(point => {
          doc.fontSize(11).fillColor('#333').text('- ' + point, { width: 500 });
          doc.moveDown(0.3);
        });
        doc.moveDown(1);
      }
    } else {
      doc.fontSize(12).fillColor('#666').text('No analysis data available. Run ATS Score first.');
    }

    doc.end();
  } catch (err) {
    console.error('Export error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
