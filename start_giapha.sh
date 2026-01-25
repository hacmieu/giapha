#!/bin/bash
# Kill process on port 8765
echo "Killing process on port 8765..."
fuser -k 8765/tcp

# Wait a moment for port to clear
sleep 1

# Start Django server
echo "Starting Django server on 0.0.0.0:8765..."
./venv/bin/python manage.py runserver 0.0.0.0:8765
