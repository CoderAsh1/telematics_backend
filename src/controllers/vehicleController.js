const db = require('../config/db');

const addVehicle = async (req, res) => {
    const { vehicle_no, imei, model, capacity, odo_meter, vehicle_type_id } = req.body;
    const transporter_id = req.user.id;

    if (!vehicle_no || !imei) {
        return res.status(400).json({ message: 'Vehicle number and IMEI are required' });
    }

    try {
        const result = await db.query(
            'INSERT INTO vehicle_master (transporter_id, vehicle_no, imei, model, capacity, odo_meter, vehicle_type_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [transporter_id, vehicle_no, imei, model, capacity, odo_meter, vehicle_type_id]
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
        let query = `
            SELECT vm.*, vt.name as vehicle_type_name 
            FROM vehicle_master vm
            LEFT JOIN vehicle_types vt ON vm.vehicle_type_id = vt.id
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

const getLiveStatus = async (req, res) => {
    const { id, role } = req.user;

    try {
        let query = `
            SELECT 
                vm.id as vehicle_id,
                vm.vehicle_no, 
                vm.imei, 
                vt.name as vehicle_type, 
                vsl.latitude,
                vsl.longitude,
                vsl.speed,
                vsl.angle,
                vsl.voltage,
                vsl.status,
                vsl.last_update,
                COALESCE(vsl.icon, vti.icon_url) as current_icon
            FROM vehicle_master vm
            LEFT JOIN vehicle_types vt ON vm.vehicle_type_id = vt.id
            LEFT JOIN vehicle_status_live vsl ON vm.id = vsl.vehicle_id
            LEFT JOIN vehicle_type_icons vti ON vm.vehicle_type_id = vti.vehicle_type_id AND vsl.status = vti.status
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

const updateVehicle = async (req, res) => {
    const { id } = req.params;
    const { vehicle_no, imei, model, capacity, odo_meter, vehicle_type_id, is_active } = req.body;
    const { id: userId, role } = req.user;

    try {
        const userRole = role ? role.toLowerCase() : '';

        // Permission check: transporters can only update their own vehicles
        if (userRole !== 'admin') {
            const ownershipCheck = await db.query('SELECT id FROM vehicle_master WHERE id = $1 AND transporter_id = $2', [id, userId]);
            if (ownershipCheck.rows.length === 0) {
                return res.status(403).json({ message: 'Access denied or vehicle not found' });
            }
        }

        const result = await db.query(
            `UPDATE vehicle_master 
             SET vehicle_no = COALESCE($1, vehicle_no), 
                 imei = COALESCE($2, imei), 
                 model = COALESCE($3, model), 
                 capacity = COALESCE($4, capacity), 
                 odo_meter = COALESCE($5, odo_meter), 
                 vehicle_type_id = COALESCE($6, vehicle_type_id),
                 is_active = COALESCE($7, is_active)
             WHERE id = $8 RETURNING *`,
            [vehicle_no, imei, model, capacity, odo_meter, vehicle_type_id, is_active, id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const deleteVehicle = async (req, res) => {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    try {
        const userRole = role ? role.toLowerCase() : '';

        // Permission check
        if (userRole !== 'admin') {
            const ownershipCheck = await db.query('SELECT id FROM vehicle_master WHERE id = $1 AND transporter_id = $2', [id, userId]);
            if (ownershipCheck.rows.length === 0) {
                return res.status(403).json({ message: 'Access denied or vehicle not found' });
            }
        }

        await db.query('DELETE FROM vehicle_master WHERE id = $1', [id]);
        res.json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { addVehicle, getVehicles, getLiveStatus, getTelemetry, updateVehicle, deleteVehicle };
