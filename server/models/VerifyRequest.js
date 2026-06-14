const mongoose = require('mongoose');

const verifyRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  linkedin: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNote: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('VerifyRequest', verifyRequestSchema);
