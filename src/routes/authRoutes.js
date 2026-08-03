/**
 * authRoutes.js
 * Purpose: Authentication API routes
 */

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');

router.post('/login', AuthController.login);
router.get('/credentials', AuthController.getDefaultCredentials);

module.exports = router;
