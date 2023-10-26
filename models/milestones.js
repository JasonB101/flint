const mongoose = require('mongoose');

const milestonesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  scores: {
    day: {
      listed: mongoose.Schema.Types.Mixed,
      sold: mongoose.Schema.Types.Mixed,
      pulled: mongoose.Schema.Types.Mixed,
      sales: mongoose.Schema.Types.Mixed,
      spent: mongoose.Schema.Types.Mixed,
    },
    week: {
      listed: mongoose.Schema.Types.Mixed,
      sold: mongoose.Schema.Types.Mixed,
      pulled: mongoose.Schema.Types.Mixed,
      sales: mongoose.Schema.Types.Mixed,
      spent: mongoose.Schema.Types.Mixed,
    },
    month: {
      listed: mongoose.Schema.Types.Mixed,
      sold: mongoose.Schema.Types.Mixed,
      pulled: mongoose.Schema.Types.Mixed,
      sales: mongoose.Schema.Types.Mixed,
      spent: mongoose.Schema.Types.Mixed,
    },
  },
});

const Milestones = mongoose.model('Milestones', milestonesSchema);

module.exports = Milestones;
