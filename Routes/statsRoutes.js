// routes/statsRoutes.js
const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
// POPRAWKA: Importujemy równie¿ isAdmin
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// Strona statystyk dostêpna TYLKO dla zalogowanych Administratorów
router.get('/stats', isAuthenticated, isAdmin, statsController.getStatsPage);

module.exports = router;