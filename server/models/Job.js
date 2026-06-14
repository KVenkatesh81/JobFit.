const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  company: { type: String, required: true, trim: true },
  location: { type: String, required: true },
  type: { type: String, enum: ['Remote', 'Onsite', 'Hybrid'], default: 'Onsite' },
  salary: { type: String, default: '' },
  skills: [{ type: String }],
  description: { type: String, required: true },
  applyLink: { type: String, required: true },
  deadline: { type: Date, required: true },
  featured: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  views: { type: Number, default: 0 },
  applyClicks: { type: Number, default: 0 },
  savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  appliedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
