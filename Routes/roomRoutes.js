const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { isAdmin, isAuthenticated } = require('../middleware/auth');


router.get('/', isAuthenticated, roomController.getAllRooms);
router.post('/', isAuthenticated, isAdmin, roomController.createRoom);
router.post('/rooms/:roomId/delete', isAuthenticated, isAdmin, roomController.deleteRoom);
router.post('/rooms/:roomId/edit', roomController.updateRoom);

module.exports = router;