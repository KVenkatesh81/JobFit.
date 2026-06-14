const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String, enum: ['pdf', 'docx'], required: true },
  extractedText: { type: String, default: '' },
  atsScore: { type: Number, default: null },
  analysis: { type: Object, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);
