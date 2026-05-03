const express = require('express');
const { addVehicle, getVehicles, getLiveStatus, getTelemetry, updateVehicle, deleteVehicle } = require('../controllers/vehicleController');
const authenticateToken = require('../middleware/authMiddleware');
const router = express.Router();

router.use(authenticateToken); // Protect all vehicle routes

router.post('/', addVehicle);
router.get('/', getVehicles);
router.get('/live', getLiveStatus);
router.get('/:vehicle_id/telemetry', getTelemetry);
router.put('/:id', updateVehicle);
router.delete('/:id', deleteVehicle);

module.exports = router;
