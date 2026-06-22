const mongoose = require('mongoose');

const techBankSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },
  targetRole: { type: String, default: '' },
  questions: [{ type: Object }],
  tips: [{ type: Object }],
}, { timestamps: true });

module.exports = mongoose.model('TechBank', techBankSchema);
