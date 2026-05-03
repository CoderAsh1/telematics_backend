-- TimescaleDB Extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50), 
    access_role VARCHAR(50), 
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle Master Table
CREATE TABLE IF NOT EXISTS vehicle_master (
    id SERIAL PRIMARY KEY,
    transporter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    vehicle_no TEXT UNIQUE NOT NULL,
    imei TEXT UNIQUE NOT NULL,
    model TEXT,
    vehicle_type TEXT DEFAULT 'truck', 
    capacity TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    odo_meter DOUBLE PRECISION
);

-- Vehicle Telemetry Table (Hypertable)
CREATE TABLE IF NOT EXISTS vehicle_telemetry (
    "time" TIMESTAMP WITH TIME ZONE NOT NULL,
    vehicle_id INTEGER REFERENCES vehicle_master(id) ON DELETE CASCADE,
    speed DOUBLE PRECISION,
    angle INTEGER,
    voltage DOUBLE PRECISION,
    ignition BOOLEAN,
    signal INTEGER,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    deviated BOOLEAN DEFAULT false,
    segment TEXT
);

-- Vehicle Status Live Table
CREATE TABLE IF NOT EXISTS vehicle_status_live (
    vehicle_id INTEGER PRIMARY KEY REFERENCES vehicle_master(id) ON DELETE CASCADE,
    last_update TIMESTAMP WITH TIME ZONE,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    speed DOUBLE PRECISION,
    ignition BOOLEAN,
    voltage DOUBLE PRECISION,
    angle INTEGER,
    status TEXT, 
    icon TEXT    
);

-- Vehicle Icon Mapping Table
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_telemetry_playback ON vehicle_telemetry (vehicle_id, "time" DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_transporter ON vehicle_master (transporter_id);

-- Constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_vehicle_time') THEN
        ALTER TABLE vehicle_telemetry ADD CONSTRAINT unique_vehicle_time UNIQUE (vehicle_id, "time");
    END IF;
END $$;