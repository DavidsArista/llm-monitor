from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware  # ADD THIS
from pydantic import BaseModel
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import List, Optional
import os

# Initialize FastAPI app
app = FastAPI(title="LLM Monitor API")

# ADD THIS CORS MIDDLEWARE
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection details
DB_CONFIG = {
    "dbname": os.getenv("POSTGRES_DB", "llm_monitor"),
    "user": os.getenv("POSTGRES_USER", "postgres"),
    "password": os.getenv("POSTGRES_PASSWORD", "postgres"),
    "host": os.getenv("DB_HOST", "localhost"),
    "port": "5432"
}

# Data model for incoming LLM events
class LLMEvent(BaseModel):
    model: str
    prompt: str
    response: str
    latency_ms: int
    tokens_used: int
    estimated_cost: Optional[float] = None

# Data model for returning events
class LLMEventResponse(BaseModel):
    id: int
    timestamp: datetime
    model: str
    prompt: str
    response: str
    latency_ms: int
    tokens_used: int
    estimated_cost: Optional[float]

# Helper function to get database connection
def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

# Root endpoint - just to test server is running
@app.get("/")
async def root():
    return {
        "message": "LLM Monitor API is running!",
        "endpoints": {
            "POST /ingest": "Submit an LLM event",
            "GET /events": "Retrieve recent events",
            "GET /stats": "Get summary statistics"
        }
    }

# POST endpoint - Ingest LLM events
@app.post("/ingest")
async def ingest_event(event: LLMEvent):
    """
    Receive and store an LLM event in the database
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Calculate estimated cost if not provided
        cost = event.estimated_cost
        if cost is None:
            # Rough estimate: $0.001 per 1000 tokens
            cost = (event.tokens_used / 1000) * 0.001
        
        # Insert into database
        cursor.execute("""
            INSERT INTO llm_events 
            (model, prompt, response, latency_ms, tokens_used, estimated_cost)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            event.model,
            event.prompt,
            event.response,
            event.latency_ms,
            event.tokens_used,
            cost
        ))
        
        event_id = cursor.fetchone()[0]
        conn.commit()
        
        return {
            "status": "success",
            "message": "Event recorded successfully",
            "event_id": event_id
        }
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to insert event: {str(e)}")
    
    finally:
        cursor.close()
        conn.close()

# GET endpoint - Retrieve events
@app.get("/events", response_model=List[LLMEventResponse])
async def get_events(limit: int = 100, model: Optional[str] = None):
    """
    Retrieve recent LLM events from the database
    
    Parameters:
    - limit: Number of events to return (default 100)
    - model: Filter by model name (optional)
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if model:
            cursor.execute("""
                SELECT id, timestamp, model, prompt, response, latency_ms, tokens_used, estimated_cost
                FROM llm_events
                WHERE model = %s
                ORDER BY timestamp DESC
                LIMIT %s
            """, (model, limit))
        else:
            cursor.execute("""
                SELECT id, timestamp, model, prompt, response, latency_ms, tokens_used, estimated_cost
                FROM llm_events
                ORDER BY timestamp DESC
                LIMIT %s
            """, (limit,))
        
        events = cursor.fetchall()
        return events
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch events: {str(e)}")
    
    finally:
        cursor.close()
        conn.close()

# GET endpoint - Summary statistics
@app.get("/stats")
async def get_stats():
    """
    Get summary statistics about all LLM events
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cursor.execute("""
            SELECT 
                COUNT(*) as total_events,
                COUNT(DISTINCT model) as unique_models,
                AVG(latency_ms) as avg_latency_ms,
                AVG(tokens_used) as avg_tokens,
                SUM(estimated_cost) as total_cost
            FROM llm_events
        """)
        
        stats = cursor.fetchone()
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stats: {str(e)}")
    
    finally:
        cursor.close()
        conn.close()

# Run with: uvicorn main:app --reload