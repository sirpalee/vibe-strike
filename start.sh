#!/bin/bash

# Determine which Python command to use
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
else
    PYTHON_CMD="python"
fi

# Start the no-cache Python HTTP server in the background
$PYTHON_CMD nocache_server.py &
SERVER_PID=$!

# Wait a moment for the server to start
sleep 1

# Try to open Firefox, fall back to message if not available
if command -v firefox &> /dev/null; then
    firefox http://localhost:8000
else
    echo "Open http://localhost:8000 in your web browser"
fi

# Function to handle script termination
cleanup() {
    echo "Shutting down server..."
    kill $SERVER_PID
    exit 0
}

# Set up trap to catch termination signals
trap cleanup SIGINT SIGTERM

# Keep the script running
wait 