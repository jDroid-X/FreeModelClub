/**
 * authRoutes.js
 * Purpose: Authentication API routes
 */

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');

router.post('/login', AuthController.login);
router.post('/change-password', AuthController.changePassword);
router.get('/credentials', AuthController.getDefaultCredentials);
router.get('/me', AuthController.getUserProfile);
router.post('/logout', (req, res) => res.json({ success: true, message: 'Logged out successfully' }));

module.exports = router;
