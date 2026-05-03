const db = require('../config/db');

// Get all vehicle types
const getTypes = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM vehicle_types ORDER BY name ASC');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Add a new vehicle type
const addType = async (req, res) => {
    const { name, description } = req.body;
    
    if (!name) {
        return res.status(400).json({ message: 'Type name is required' });
    }

    try {
        const result = await db.query(
            'INSERT INTO vehicle_types (name, description) VALUES ($1, $2) RETURNING *',
            [name.toLowerCase(), description]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ message: 'Vehicle type already exists' });
        }
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update a vehicle type
const updateType = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    try {
        const result = await db.query(
            'UPDATE vehicle_types SET name = COALESCE($1, name), description = COALESCE($2, description) WHERE id = $3 RETURNING *',
            [name ? name.toLowerCase() : null, description, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Vehicle type not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete a vehicle type
const deleteType = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await db.query('DELETE FROM vehicle_types WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Vehicle type not found' });
        }

        res.json({ message: 'Vehicle type deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get icons for a specific type
const getTypeIcons = async (req, res) => {
    const { typeId } = req.params;

    try {
        const result = await db.query('SELECT * FROM vehicle_type_icons WHERE vehicle_type_id = $1', [typeId]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Add or update an icon for a type + status
const updateTypeIcon = async (req, res) => {
    const { typeId } = req.params;
    const { status, icon_url } = req.body;

    if (!status || !icon_url) {
        return res.status(400).json({ message: 'Status and Icon URL are required' });
    }

    try {
        const result = await db.query(
            `INSERT INTO vehicle_type_icons (vehicle_type_id, status, icon_url) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (vehicle_type_id, status) 
             DO UPDATE SET icon_url = EXCLUDED.icon_url 
             RETURNING *`,
            [typeId, status.toLowerCase(), icon_url]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    getTypes,
    addType,
    updateType,
    deleteType,
    getTypeIcons,
    updateTypeIcon
};
