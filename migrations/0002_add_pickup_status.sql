-- Migration to add PICKED_UP status and picked_up_at field
-- This allows tracking when cars are picked up by their owners

-- Add picked_up_at column to cars table
ALTER TABLE cars ADD COLUMN picked_up_at DATETIME;

-- Update the status check constraint to include PICKED_UP
-- First, we need to drop the existing constraint and recreate it
PRAGMA foreign_keys=off;

-- Create a new table with the updated constraint
CREATE TABLE cars_new (
    id INTEGER PRIMARY KEY,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    color TEXT NOT NULL,
    license_plate TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PRE_ARRIVAL' CHECK (status IN ('PRE_ARRIVAL', 'REGISTERED', 'ON_DECK', 'DONE', 'PICKED_UP')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    registered_at DATETIME,
    on_deck_at DATETIME,
    completed_at DATETIME,
    picked_up_at DATETIME
);

-- Copy data from old table to new table
INSERT INTO cars_new SELECT * FROM cars;

-- Drop the old table
DROP TABLE cars;

-- Rename the new table to the original name
ALTER TABLE cars_new RENAME TO cars;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_cars_status ON cars(status);
CREATE INDEX IF NOT EXISTS idx_cars_license_plate ON cars(license_plate);

PRAGMA foreign_keys=on; 