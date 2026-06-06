// routes/roomRoutes.js
const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { isAdmin, isAuthenticated } = require('../middleware/auth'); // Import obu stra¿ników

// Lista sal wymaga bycia zalogowanym
router.get('/', isAuthenticated, roomController.getAllRooms);
// Dodawanie sal wymaga zalogowania ORAZ bycia adminem
router.post('/', isAuthenticated, isAdmin, roomController.createRoom);
router.post('/rooms/:roomId/delete', isAuthenticated, isAdmin, roomController.deleteRoom);
// Trasa obs³uguj¹ca wys³anie formularza edycji sali
router.post('/rooms/:roomId/edit', roomController.updateRoom);

module.exports = router;