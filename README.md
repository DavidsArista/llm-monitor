# LLM Monitor

A lightweight, self-hosted monitoring platform for tracking LLM API costs and performance. Built to solve observability gaps I encountered while working on SacGPT at the City of Sacramento.

## Quick Start
```bash
cat > README.md << 'EOF'
# LLM Monitor

A lightweight, self-hosted monitoring platform for tracking LLM API costs and performance. Built to solve observability gaps I encountered while working on SacGPT at the City of Sacramento.

## Quick Start
```bash
git clone https://github.com/DavidsArista/llm-monitor
cd llm-monitor
docker compose up
```

Visit http://localhost:3000

That's it. Docker handles everything.

## The Problem

While building SacGPT (a RAG system serving 500+ city employees), we had zero visibility into our Gemini API usage. We didn't know:
- Which queries were expensive vs cheap
- If response times were degrading
- Whether we could use cheaper models without sacrificing quality

Existing tools like LangSmith ($2K+/month) were too expensive for a government budget.

## What It Does

- **Real-time Cost Tracking** - See exactly what each call costs
- **Performance Monitoring** - Track latency across different models
- **Model Comparison** - Compare GPT-4 vs Claude vs Gemini side-by-side
- **Auto-refresh Dashboard** - Updates every 10 seconds

## Comparison to Alternatives

| Feature | LLM Monitor | LangSmith | Helicone |
|---------|-------------|-----------|----------|
| Cost | Free (self-hosted) | $2K+/month | $500+/month |
| Setup | `docker compose up` | Complex setup | Medium setup |
| Best For | Startups, Gov, Solo | Enterprise | Mid-market |

## Architecture
```
Your App → POST /ingest → FastAPI → PostgreSQL
                                  ↓
                           React Dashboard
```

**Performance Impact:** <10ms overhead on request path (async logging to database)

## API Usage
```bash
# Log an LLM call
curl -X POST http://localhost:8000/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "prompt": "your prompt here",
    "response": "model response",
    "latency_ms": 1234,
    "tokens_used": 150
  }'

# Get stats
curl http://localhost:8000/stats

# Get recent events
curl http://localhost:8000/events?limit=20
```

## Real-World Use Case

At the City of Sacramento, identifying that 70% of SacGPT queries could use a cheaper model without quality loss could theoretically save ~30% in API costs.

For a company making 1M calls/month at $0.03/call average, switching 70% of calls to a model that costs $0.003 saves ~$19K/month.

## Tech Stack

- **Backend:** FastAPI + PostgreSQL
- **Frontend:** React + Recharts
- **Infrastructure:** Docker Compose

Chose these for fast iteration, easy deployment, and good time-series data handling.

## Development

To run locally without Docker:
```bash
# Start PostgreSQL
createdb llm_monitor
psql llm_monitor < schema.sql

# Backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd dashboard
npm install
npm start
```

## What It Doesn't Do (Yet)

- No distributed tracing (use OpenTelemetry for that)
- No semantic caching
- No alerting system
- No PII masking

These are on the roadmap but kept the MVP focused on core monitoring.

## Built By

**David Arista**  
CS @ UC Davis | AI/ML Intern @ City of Sacramento

Built during my internship to address real observability gaps in production LLM systems.

## License

MIT
