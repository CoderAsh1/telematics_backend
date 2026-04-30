const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Extra check: Verify user still exists in database
        const result = await db.query('SELECT id, email, role, access_role FROM users WHERE id = $1', [decoded.id]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'User no longer exists.' });
        }

        if (!user.role || !user.access_role) {
            return res.status(403).json({ message: 'Access denied. Account is incomplete (missing role or access level).' });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token has expired.' });
        }
        res.status(403).json({ message: 'Invalid token.' });
    }
};

module.exports = authenticateToken;
