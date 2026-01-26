#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Phaser Kiosk Game Development Servers...${NC}"

# Get the script's directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"

# Check if node_modules exist
if [ ! -d "$PROJECT_ROOT/docker/app/server/node_modules" ] || [ ! -d "$PROJECT_ROOT/docker/app/client/node_modules" ]; then
    echo -e "${RED}Warning: Dependencies not installed.${NC}"
    echo "Please run: npm install in both or use /install in claude code:"
    echo "  1. docker/app/server"
    echo "  2. docker/app/client"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\n${BLUE}Shutting down services...${NC}"
    
    # Kill all child processes
    jobs -p | xargs -r kill 2>/dev/null
    
    # Wait for processes to terminate
    wait
    
    echo -e "${GREEN}Services stopped successfully.${NC}"
    exit 0
}

# Trap EXIT, INT, and TERM signals
trap cleanup EXIT INT TERM

# Start server (Express + Socket.io)
echo -e "${GREEN}Starting game server (Express + Socket.io)...${NC}"
cd "$PROJECT_ROOT/docker/app/server"
npm run dev &
SERVER_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
sleep 3

# Check if server is running
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo -e "${RED}Server failed to start!${NC}"
    exit 1
fi

# Start client (Phaser game with Vite)
echo -e "${GREEN}Starting game client (Phaser + Vite)...${NC}"
cd "$PROJECT_ROOT/docker/app/client"
npm run dev &
CLIENT_PID=$!

# Wait for client to start
sleep 3

# Check if client is running
if ! kill -0 $CLIENT_PID 2>/dev/null; then
    echo -e "${RED}Client failed to start!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Development servers started successfully!${NC}"
echo -e "${BLUE}Game Client: http://localhost:8080${NC}"
echo -e "${BLUE}Game Server: http://localhost:3000${NC}"
echo ""
echo "Press Ctrl+C to stop all services..."

# Wait for user to press Ctrl+C
wait