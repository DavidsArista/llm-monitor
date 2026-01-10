#!/bin/bash

# LLM Monitor - Quick Start Script

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "🤖 Starting LLM Monitor..."
echo ""

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo -e "${BLUE}Starting PostgreSQL...${NC}"
    brew services start postgresql@14
    sleep 2
fi

# Start FastAPI
echo -e "${GREEN}✓ Starting backend (port 8000)${NC}"
osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"' && source venv/bin/activate && uvicorn main:app --reload"'

sleep 2

# Start React
echo -e "${GREEN}✓ Starting frontend (port 3000)${NC}"
osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"'/dashboard && npm start"'

echo ""
echo -e "${GREEN}✓ Services started!${NC}"
echo ""
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
echo ""
