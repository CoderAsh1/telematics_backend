const express = require('express');
const multer = require('multer');
const { uploadToR2 } = require('../controllers/uploadController');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Protect upload routes
router.use(authenticateToken);

// Single file upload endpoint
router.post('/icon', upload.single('icon'), uploadToR2);

module.exports = router;
