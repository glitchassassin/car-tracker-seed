-- Initial database schema for car tracker
-- Creates cars table with all required fields for tracking through oil change process

CREATE TABLE IF NOT EXISTS cars (
    id INTEGER PRIMARY KEY,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    color TEXT NOT NULL,
    license_plate TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PRE_ARRIVAL' CHECK (status IN ('PRE_ARRIVAL', 'REGISTERED', 'ON_DECK', 'DONE')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    registered_at DATETIME,
    on_deck_at DATETIME,
    completed_at DATETIME
);

-- Create index on status for efficient querying by volunteer interfaces
CREATE INDEX IF NOT EXISTS idx_cars_status ON cars(status);

-- Create index on license_plate for lookup verification
CREATE INDEX IF NOT EXISTS idx_cars_license_plate ON cars(license_plate); 