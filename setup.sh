#!/bin/bash

# LLM Monitor - Setup & Run Script
# Author: David Arista
# Description: Automated setup and launch script for LLM monitoring system

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print colored output
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }

echo ""
echo "=================================================="
echo "🤖 LLM Monitor - Setup & Run Script"
echo "=================================================="
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if PostgreSQL is running
check_postgres() {
    if pg_isready -q; then
        return 0
    else
        return 1
    fi
}

# Function to check if database exists
db_exists() {
    psql -lqt | cut -d \| -f 1 | grep -qw "$1"
}

# =====================================
# 1. Check Prerequisites
# =====================================
print_info "Checking prerequisites..."

if ! command_exists python3; then
    print_error "Python3 is not installed. Please install it first."
    exit 1
fi
print_success "Python3 found"

if ! command_exists node; then
    print_error "Node.js is not installed. Please install it first."
    exit 1
fi
print_success "Node.js found"

if ! command_exists psql; then
    print_error "PostgreSQL is not installed. Please install it first."
    print_info "Run: brew install postgresql@14"
    exit 1
fi
print_success "PostgreSQL found"

# =====================================
# 2. Start PostgreSQL if not running
# =====================================
print_info "Checking PostgreSQL status..."

if check_postgres; then
    print_success "PostgreSQL is running"
else
    print_warning "PostgreSQL is not running. Starting it..."
    brew services start postgresql@14
    sleep 3
    
    if check_postgres; then
        print_success "PostgreSQL started successfully"
    else
        print_error "Failed to start PostgreSQL"
        exit 1
    fi
fi

# =====================================
# 3. Setup Database
# =====================================
print_info "Setting up database..."

if db_exists "llm_monitor"; then
    print_success "Database 'llm_monitor' already exists"
else
    print_info "Creating database 'llm_monitor'..."
    createdb llm_monitor
    print_success "Database created"
fi

# Check if table exists
TABLE_EXISTS=$(psql -d llm_monitor -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name='llm_events');")

if [ "$TABLE_EXISTS" = "t" ]; then
    print_success "Table 'llm_events' already exists"
else
    print_info "Creating table 'llm_events'..."
    psql -d llm_monitor <<EOF
CREATE TABLE llm_events (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT NOW(),
    model VARCHAR(100) NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    latency_ms INTEGER NOT NULL,
    tokens_used INTEGER NOT NULL,
    estimated_cost DECIMAL(10, 6)
);
EOF
    print_success "Table created"
fi

# =====================================
# 4. Setup Python Backend
# =====================================
print_info "Setting up Python backend..."

# Create venv if it doesn't exist
if [ ! -d "venv" ]; then
    print_info "Creating Python virtual environment..."
    python3 -m venv venv
    print_success "Virtual environment created"
fi

# Activate venv and install dependencies
print_info "Installing Python dependencies..."
source venv/bin/activate
pip install -q --upgrade pip
pip install -q fastapi uvicorn psycopg2-binary requests
print_success "Python dependencies installed"

# =====================================
# 5. Setup React Frontend
# =====================================
if [ ! -d "dashboard" ]; then
    print_error "Dashboard directory not found!"
    print_info "Please create the React app first with:"
    print_info "  npx create-react-app dashboard"
    exit 1
fi

print_info "Setting up React frontend..."
cd dashboard

if [ ! -d "node_modules" ]; then
    print_info "Installing npm dependencies..."
    npm install --silent
    print_success "npm dependencies installed"
else
    print_success "npm dependencies already installed"
fi

# Install recharts if not present
if ! grep -q "recharts" package.json; then
    print_info "Installing recharts..."
    npm install --silent recharts
    print_success "Recharts installed"
fi

cd ..

# =====================================
# 6. Check if test data exists
# =====================================
EVENT_COUNT=$(psql -d llm_monitor -tAc "SELECT COUNT(*) FROM llm_events;")

print_info "Current events in database: $EVENT_COUNT"

if [ "$EVENT_COUNT" -lt 10 ]; then
    print_warning "Low event count. Would you like to generate test data? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_info "Generating test data..."
        source venv/bin/activate
        python test_load.py <<EOF
50
EOF
        print_success "Test data generated"
    fi
fi

# =====================================
# 7. Display Summary
# =====================================
echo ""
echo "=================================================="
print_success "Setup Complete!"
echo "=================================================="
echo ""
print_info "Database: llm_monitor ($EVENT_COUNT events)"
print_info "Backend: FastAPI (Python)"
print_info "Frontend: React + Recharts"
echo ""

# =====================================
# 8. Start Services
# =====================================
print_warning "Ready to start services?"
echo ""
echo "This will open 2 terminal windows:"
echo "  1. FastAPI backend (port 8000)"
echo "  2. React frontend (port 3000)"
echo ""
read -p "Start now? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Starting services..."
    
    # Start FastAPI in background
    print_info "Starting FastAPI backend..."
    osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"' && source venv/bin/activate && uvicorn main:app --reload"'
    
    sleep 2
    
    # Start React in background
    print_info "Starting React frontend..."
    osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"'/dashboard && npm start"'
    
    echo ""
    print_success "Services starting in new terminal windows!"
    echo ""
    print_info "Backend:  http://localhost:8000"
    print_info "Frontend: http://localhost:3000"
    print_info "API Docs: http://localhost:8000/docs"
    echo ""
    print_warning "Press Ctrl+C in each terminal to stop the services"
else
    echo ""
    print_info "To start manually, run:"
    echo ""
    echo "Terminal 1 (Backend):"
    echo "  cd $(pwd)"
    echo "  source venv/bin/activate"
    echo "  uvicorn main:app --reload"
    echo ""
    echo "Terminal 2 (Frontend):"
    echo "  cd $(pwd)/dashboard"
    echo "  npm start"
fi

echo ""
echo "=================================================="
print_success "All done!"
echo "=================================================="
echo ""
