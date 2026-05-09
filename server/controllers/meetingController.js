const Meeting = require('../models/Meeting');
const moment = require('moment-timezone');

exports.createMeeting = async (req, res) => {
  try {
    const { title, dateTime, fromTZ, toTZ } = req.body;
    const convertedTime = moment.tz(dateTime, fromTZ).tz(toTZ).format('YYYY-MM-DD HH:mm z');
    const meeting = await Meeting.create({ title, dateTime, fromTZ, toTZ, convertedTime, createdBy: req.user.id });
    res.status(201).json(meeting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.find({ createdBy: req.user.id }).sort({ dateTime: 1 });
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateMeeting = async (req, res) => {
  try {
    const { title, dateTime, fromTZ, toTZ } = req.body;
    const convertedTime = moment.tz(dateTime, fromTZ).tz(toTZ).format('YYYY-MM-DD HH:mm z');
    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      { title, dateTime, fromTZ, toTZ, convertedTime },
      { new: true }
    );
    res.json(meeting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteMeeting = async (req, res) => {
  try {
    await Meeting.findByIdAndDelete(req.params.id);
    res.json({ message: 'Meeting deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
