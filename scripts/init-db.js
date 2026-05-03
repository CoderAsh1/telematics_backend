const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

const initializeDatabase = async () => {
    console.log('🚀 Connecting to database...');
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('🏗️ Initializing database schema and hypertables...');
        await db.query(schema);
        console.log('✨ Database schema and TimescaleDB hypertables initialized successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error initializing database:', error.message);
        process.exit(1);
    }
};

initializeDatabase();