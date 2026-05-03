const express = require('express');
const { 
    getTypes, 
    addType, 
    updateType, 
    deleteType, 
    getTypeIcons, 
    updateTypeIcon 
} = require('../controllers/vehicleTypeController');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken); // All routes require authentication

// Type management
router.get('/', getTypes);
router.post('/', addType); // Should ideally be restricted to admins
router.put('/:id', updateType);
router.delete('/:id', deleteType);

// Icon management
router.get('/:typeId/icons', getTypeIcons);
router.post('/:typeId/icons', updateTypeIcon);

module.exports = router;
