-- Migration: Normalize Vehicle Types and Icons

-- 1. Create Vehicle Types Table
CREATE TABLE IF NOT EXISTS vehicle_types (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT
);

-- 2. Create Vehicle Type Icons Table
CREATE TABLE IF NOT EXISTS vehicle_type_icons (
    id SERIAL PRIMARY KEY,
    vehicle_type_id INTEGER REFERENCES vehicle_types(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    icon_url TEXT NOT NULL,
    UNIQUE(vehicle_type_id, status)
);

-- 3. Populate Vehicle Types from existing data
INSERT INTO vehicle_types (name)
SELECT DISTINCT vehicle_type FROM vehicle_master
ON CONFLICT (name) DO NOTHING;

-- Also add 'truck' if not present
INSERT INTO vehicle_types (name) VALUES ('truck') ON CONFLICT DO NOTHING;

-- 4. Add vehicle_type_id column to vehicle_master
ALTER TABLE vehicle_master ADD COLUMN IF NOT EXISTS vehicle_type_id INTEGER REFERENCES vehicle_types(id);

-- 5. Map existing vehicle_type TEXT to the new ID
UPDATE vehicle_master vm
SET vehicle_type_id = vt.id
FROM vehicle_types vt
WHERE vm.vehicle_type = vt.name;

-- 6. Clean up old column and old table
ALTER TABLE vehicle_master DROP COLUMN IF EXISTS vehicle_type;
DROP TABLE IF EXISTS vehicle_icon_mapping;

-- 7. Add some default S3 icons for 'truck' (as an example)
DO $$
DECLARE
    truck_id INTEGER;
BEGIN
    SELECT id INTO truck_id FROM vehicle_types WHERE name = 'truck';
    
    INSERT INTO vehicle_type_icons (vehicle_type_id, status, icon_url)
    VALUES 
    (truck_id, 'moving', 'https://your-s3-bucket.s3.amazonaws.com/icons/truck-moving.png'),
    (truck_id, 'idle', 'https://your-s3-bucket.s3.amazonaws.com/icons/truck-idle.png'),
    (truck_id, 'stopped', 'https://your-s3-bucket.s3.amazonaws.com/icons/truck-stopped.png'),
    (truck_id, 'offline', 'https://your-s3-bucket.s3.amazonaws.com/icons/truck-offline.png')
    ON CONFLICT DO NOTHING;
END $$;
