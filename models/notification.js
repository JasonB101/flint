const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  data: Object,
  type: String,
  isViewed: {
    type: Boolean,
    default: false,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

module.exports = mongoose.model("Notification", notificationSchema);