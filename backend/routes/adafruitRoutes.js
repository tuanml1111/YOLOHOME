const express = require('express');
const router = express.Router();
const adafruitController = require('../controllers/adafruitController');
const authMiddleware = require('../middleware/authMiddleware');

// Protect all routes
router.use(authMiddleware.protect);

router.post('/command', adafruitController.sendCommand);
router.get('/fetch', adafruitController.fetchData);

module.exports = router;