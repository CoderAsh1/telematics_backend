-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50), -- corresponding to your user_role type
    access_role VARCHAR(50), -- corresponding to your access_level type
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
    capacity TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    odo_meter DOUBLE PRECISION
);

-- Vehicle Telemetry Table
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
    segment TEXT,
    CONSTRAINT unique_vehicle_time UNIQUE (vehicle_id, "time")
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
    angle INTEGER
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_telemetry_playback ON vehicle_telemetry USING btree (vehicle_id, "time" DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_transporter ON vehicle_master USING btree (transporter_id);
CREATE INDEX IF NOT EXISTS vehicle_telemetry_time_idx ON vehicle_telemetry USING btree ("time" DESC);
