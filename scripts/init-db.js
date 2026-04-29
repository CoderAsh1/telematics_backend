const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

const initializeDatabase = async () => {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('Initializing database schema...');
        await db.query(schema);
        console.log('Database schema initialized successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
};

initializeDatabase();
