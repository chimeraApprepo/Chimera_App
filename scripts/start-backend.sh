#!/bin/bash

# Start backend with proper environment
cd "$(dirname "$0")/.."

# Check if .env exists
if [ ! -f .env ]; then
    echo "Error: .env file not found"
    echo "Please create .env file with required variables"
    exit 1
fi

# Source .env
export $(cat .env | grep -v '^#' | xargs)

# Start backend
node src/index.js

