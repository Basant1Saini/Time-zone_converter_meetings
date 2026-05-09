const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title:         { type: String, required: true },
  dateTime:      { type: Date, required: true },
  fromTZ:        { type: String, required: true },
  toTZ:          { type: String, required: true },
  convertedTime: { type: String },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);
