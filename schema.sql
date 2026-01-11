CREATE TABLE IF NOT EXISTS llm_events (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT NOW(),
    model VARCHAR(100) NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    latency_ms INTEGER NOT NULL,
    tokens_used INTEGER NOT NULL,
    estimated_cost DECIMAL(10, 6)
);

CREATE INDEX idx_timestamp ON llm_events(timestamp DESC);
CREATE INDEX idx_model ON llm_events(model);
