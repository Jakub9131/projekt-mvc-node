const { isAuthenticated, isAdmin } = require('../middleware/auth');
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/auth', authController.getAuthPage);

router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/logout', authController.logout);
router.get('/profile', isAuthenticated, authController.getProfilePage);
router.post('/profile/create-user', isAuthenticated, isAdmin, authController.createUserByAdmin);
router.post('/notifications/read', isAuthenticated, authController.markNotificationsAsRead);
router.post('/profile/users/:userId/edit', authController.updateUserByAdmin);
router.post('/profile/users/:userId/delete', authController.deleteUserByAdmin);
router.post('/profile/change-password', authController.changePassword);
router.post('/profile/users/:userId/reset-password', authController.resetPasswordByAdmin);

module.exports = router;