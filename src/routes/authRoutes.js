const express = require('express');
const { signup, login, updateUser } = require('../controllers/authController');
const authenticateToken = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.put('/update', authenticateToken, updateUser);

module.exports = router;
