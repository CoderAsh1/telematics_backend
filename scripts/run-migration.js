const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

const runMigration = async () => {
    try {
        const migrationPath = path.join(__dirname, 'migration_v2.sql');
        const migration = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('Running migration...');
        await db.query(migration);
        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error running migration:', error);
        process.exit(1);
    }
};

runMigration();
