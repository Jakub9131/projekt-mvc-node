const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/stats', isAuthenticated, isAdmin, statsController.getStatsPage);

module.exports = router;