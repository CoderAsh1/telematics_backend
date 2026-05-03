-- TimescaleDB Extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Migration to add vehicle icons and status
ALTER TABLE vehicle_master ADD COLUMN IF NOT EXISTS vehicle_type TEXT DEFAULT 'truck';
ALTER TABLE vehicle_status_live ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE vehicle_status_live ADD COLUMN IF NOT EXISTS icon TEXT;

CREATE TABLE IF NOT EXISTS vehicle_icon_mapping (
    id SERIAL PRIMARY KEY,
    vehicle_type TEXT NOT NULL,
    status TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    icon_url TEXT,
    UNIQUE(vehicle_type, status)
);

-- TimescaleDB Hypertable initialization
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM timescaledb_information.hypertables 
        WHERE hypertable_name = 'vehicle_telemetry'
    ) THEN
        PERFORM create_hypertable('vehicle_telemetry', 'time', migrate_data => true);
    END IF;
END $$;

-- Optional: Insert some default mappings
INSERT INTO vehicle_icon_mapping (vehicle_type, status, icon_name) 
VALUES 
('truck', 'running', 'truck-green'),
('truck', 'idle', 'truck-orange'),
('truck', 'stopped', 'truck-red'),
('truck', 'offline', 'truck-grey')
ON CONFLICT (vehicle_type, status) DO NOTHING;
