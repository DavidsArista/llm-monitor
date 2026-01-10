#!/bin/bash

# LLM Monitor - Stop Services Script

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

echo ""
echo -e "Stopping LLM Monitor..."
echo ""

# Kill processes on ports 8000 and 3000
if lsof -ti:8000 >/dev/null 2>&1; then
    echo "Stopping FastAPI (port 8000)..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    echo -e "FastAPI stopped"
else
    echo "FastAPI not running"
fi

if lsof -ti:3000 >/dev/null 2>&1; then
    echo "Stopping React (port 3000)..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    echo -e "React stopped${NC}"
else
    echo "React not running"
fi

echo ""
echo -e "${GREEN}✓ All services stopped${NC}"
echo ""
