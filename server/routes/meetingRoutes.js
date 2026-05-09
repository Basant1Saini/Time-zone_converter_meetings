const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { createMeeting, getMeetings, updateMeeting, deleteMeeting } = require('../controllers/meetingController');

router.use(auth);
router.get('/', getMeetings);
router.post('/', createMeeting);
router.put('/:id', updateMeeting);
router.delete('/:id', deleteMeeting);

module.exports = router;
