-- Defines the schema for the port congestion metrics database.

CREATE TABLE port_metrics (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    location TEXT NOT NULL,
    vessel_count INTEGER NOT NULL
);
