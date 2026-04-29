const db = require('../config/db');

const addVehicle = async (req, res) => {
    const { vehicle_no, imei, model, capacity, odo_meter } = req.body;
    const transporter_id = req.user.id;

    if (!vehicle_no || !imei) {
        return res.status(400).json({ message: 'Vehicle number and IMEI are required' });
    }

    try {
        const result = await db.query(
            'INSERT INTO vehicle_master (transporter_id, vehicle_no, imei, model, capacity, odo_meter) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [transporter_id, vehicle_no, imei, model, capacity, odo_meter]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ message: 'Vehicle number or IMEI already exists' });
        }
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getVehicles = async (req, res) => {
    const transporter_id = req.user.id;

    try {
        const result = await db.query(
            'SELECT * FROM vehicle_master WHERE transporter_id = $1',
            [transporter_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getLiveStatus = async (req, res) => {
    const transporter_id = req.user.id;

    try {
        const query = `
            SELECT vm.vehicle_no, vm.imei, vsl.* 
            FROM vehicle_status_live vsl
            JOIN vehicle_master vm ON vsl.vehicle_id = vm.id
            WHERE vm.transporter_id = $1
        `;
        const result = await db.query(query, [transporter_id]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getTelemetry = async (req, res) => {
    const { vehicle_id } = req.params;
    const transporter_id = req.user.id;

    try {
        const vehicleCheck = await db.query(
            'SELECT id FROM vehicle_master WHERE id = $1 AND transporter_id = $2',
            [vehicle_id, transporter_id]
        );

        if (vehicleCheck.rows.length === 0) {
            return res.status(403).json({ message: 'Access denied or vehicle not found' });
        }

        const result = await db.query(
            'SELECT * FROM vehicle_telemetry WHERE vehicle_id = $1 ORDER BY "time" DESC LIMIT 100',
            [vehicle_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { addVehicle, getVehicles, getLiveStatus, getTelemetry };
