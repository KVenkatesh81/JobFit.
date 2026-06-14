const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  status: { type: String, enum: ['Applied', 'Interviewing', 'Rejected', 'Offered'], default: 'Applied' },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
