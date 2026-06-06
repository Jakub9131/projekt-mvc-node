// routes/reservationRoutes.js
const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { isAdmin, isAuthenticated } = require('../middleware/auth'); // Import obu stra¿ników

// Wszystkie operacje na rezerwacjach wymagaj¹ zalogowania
router.get('/rooms/:roomId/reservations', isAuthenticated, reservationController.getRoomReservations);
router.post('/rooms/:roomId/reserve', isAuthenticated, reservationController.createReservation);
router.post('/reservations/:reservationId/delete', isAuthenticated, isAdmin, reservationController.deleteReservation);
router.post('/reservations/:reservationId/cancel', isAuthenticated, reservationController.cancelReservation);
router.post('/reservations/:reservationId/edit', reservationController.updateReservationByAdmin);

module.exports = router;