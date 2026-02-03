#!/bin/bash
# TPMJS Executor Bootstrap Script for Unsandbox
# This script downloads and runs the TPMJS executor
set -e

echo "=== TPMJS Executor for Unsandbox ==="
echo "Starting deployment..."

# Download the executor script from GitHub
EXECUTOR_URL="https://raw.githubusercontent.com/tpmjs/tpmjs/main/templates/unsandbox-executor/executor.js"

echo "Downloading executor from $EXECUTOR_URL..."
curl -fsSL "$EXECUTOR_URL" -o /root/executor.js

echo "Starting TPMJS Executor on port 80..."
exec node /root/executor.js
