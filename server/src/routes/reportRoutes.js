const express = require('express');
const { daily, monthToDate, monthly } = require('../controllers/reportController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/daily', daily);
router.get('/month-to-date', monthToDate);
router.get('/monthly', monthly);

module.exports = router;
