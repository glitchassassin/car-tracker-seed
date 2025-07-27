-- Migration to add status_history table
-- This table tracks all status changes for cars with timestamps

CREATE TABLE IF NOT EXISTS status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_status_history_car_id ON status_history(car_id);
CREATE INDEX IF NOT EXISTS idx_status_history_changed_at ON status_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_status_history_new_status ON status_history(new_status);

-- Create a composite index for common queries
CREATE INDEX IF NOT EXISTS idx_status_history_car_status ON status_history(car_id, new_status); 