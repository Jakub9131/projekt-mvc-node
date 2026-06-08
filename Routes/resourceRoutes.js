const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/resources', isAuthenticated, resourceController.getResourcesPage);
router.post('/resources/order', isAuthenticated, resourceController.createOrder);
router.post('/resources/:orderId/approve', isAuthenticated, isAdmin, resourceController.approveOrder);

module.exports = router;