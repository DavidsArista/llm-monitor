# LLM Monitor Dashboard

A monitoring platform for tracking LLM API usage. Built to solve the problem of not knowing where your LLM costs are going or why your API is getting slow.

## The Problem

When you're using GPT-4, Claude, or Gemini in production, you're basically flying blind. You get a bill at the end of the month and have no idea:
- Which queries are expensive vs cheap
- If your response times are getting worse
- Whether GPT-4 is actually better than GPT-3.5 for your use case
- Which team is burning through your API budget

## What It Does

Logs every LLM API call and shows you:
- Real-time cost breakdown
- Latency tracking
- Token usage per model
- Which models are eating your budget

The dashboard updates every 10 seconds so you can actually see what's happening.

## Tech Stack

**Backend:** FastAPI + PostgreSQL  
**Frontend:** React + Recharts  
**Why these:** Fast to build, easy to deploy, handles real-time data well

## Getting Started

Need Python 3.14+, Node 18+, and PostgreSQL.
```bash
git clone https://github.com/DavidsArista/llm-monitor
cd llm-monitor
./setup.sh
```

The script handles database setup, installs dependencies, and launches everything.

To start after initial setup:
```bash
./run.sh    # starts backend + frontend
./stop.sh   # stops everything
```

Dashboard runs on `http://localhost:3000`

## API Usage

Send LLM events to the monitoring system:
```bash
curl -X POST http://localhost:8000/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "prompt": "your prompt here",
    "response": "model response",
    "latency_ms": 1234,
    "tokens_used": 150
  }'
```

Get stats:
```bash
curl http://localhost:8000/stats
```

## Why I Built This

I'm working on SacGPT at the City of Sacramento - a RAG system that helps city employees search internal documents. We had no visibility into costs or performance, so I built this to track what was actually happening in production.

Turns out this is a common problem. Companies are spending tens of thousands per month on LLM APIs without knowing where the money goes.

## Project Structure
```
llm-monitor/
├── main.py              # FastAPI backend
├── test_load.py         # Generate test data
├── dashboard/           # React frontend
├── run.sh, stop.sh      # Convenience scripts
└── requirements.txt
```

## What I Learned

- Building REST APIs that handle high-volume event ingestion
- Real-time data visualization in React
- Database design for time-series data
- How to make monitoring actually useful (not just collecting data)

## Next Steps

Things I want to add:
- Alerting when costs spike
- A/B testing different models
- Automatic switching to cheaper models for simple queries
- Better cost attribution (by team, by feature, etc.)

## About

Built by David Arista  
CS Student @ UC Davis | AI/ML Intern @ City of Sacramento

Currently working on SacGPT and exploring how to make LLM systems more cost-effective and observable in production.
