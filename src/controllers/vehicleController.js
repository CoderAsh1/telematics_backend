const db = require('../config/db');

const addVehicle = async (req, res) => {
    const { vehicle_no, imei, model, capacity, odo_meter, vehicle_type } = req.body;
    const transporter_id = req.user.id;

    if (!vehicle_no || !imei) {
        return res.status(400).json({ message: 'Vehicle number and IMEI are required' });
    }

    try {
        const result = await db.query(
            'INSERT INTO vehicle_master (transporter_id, vehicle_no, imei, model, capacity, odo_meter, vehicle_type) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [transporter_id, vehicle_no, imei, model, capacity, odo_meter, vehicle_type || 'truck']
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
    const { id, role } = req.user;

    try {
        let query = 'SELECT * FROM vehicle_master';
        let params = [];

        const userRole = role ? role.toLowerCase() : '';

        if (userRole !== 'admin') {
            query += ' WHERE transporter_id = $1';
            params.push(id);
        }

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getLiveStatus = async (req, res) => {
    const { id, role } = req.user;

    try {
        let query = `
            SELECT 
                vm.id as vehicle_id,
                vm.vehicle_no, 
                vm.imei, 
                vm.vehicle_type, 
                vsl.latitude,
                vsl.longitude,
                vsl.speed,
                vsl.angle,
                vsl.voltage,
                vsl.status,
                vsl.last_update,
                COALESCE(vsl.icon, vim.icon_name) as current_icon
            FROM vehicle_master vm
            LEFT JOIN vehicle_status_live vsl ON vm.id = vsl.vehicle_id
            LEFT JOIN vehicle_icon_mapping vim ON vm.vehicle_type = vim.vehicle_type AND vsl.status = vim.status
        `;
        let params = [];

        const userRole = role ? role.toLowerCase() : '';

        if (userRole !== 'admin') {
            query += ' WHERE vm.transporter_id = $1';
            params.push(id);
        }

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getTelemetry = async (req, res) => {
    const { vehicle_id } = req.params;
    const { id, role } = req.user;

    try {
        const userRole = role ? role.toLowerCase() : '';
        let checkQuery = 'SELECT id FROM vehicle_master WHERE id = $1';
        let checkParams = [vehicle_id];

        if (userRole !== 'admin') {
            checkQuery += ' AND transporter_id = $2';
            checkParams.push(id);
        }

        const vehicleCheck = await db.query(checkQuery, checkParams);

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
