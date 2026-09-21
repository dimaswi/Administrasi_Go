CREATE TABLE IF NOT EXISTS shift_exchanges (
    id SERIAL PRIMARY KEY,
    requesting_user_id INTEGER NOT NULL REFERENCES users(id),
    target_user_id INTEGER NOT NULL REFERENCES users(id),
    original_roster_id INTEGER NOT NULL REFERENCES roster_schedules(id),
    target_roster_id INTEGER REFERENCES roster_schedules(id),
    status VARCHAR(20) DEFAULT 'pending',
    reason TEXT NOT NULL,
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
