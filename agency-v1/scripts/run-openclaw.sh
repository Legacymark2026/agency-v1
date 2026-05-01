#!/bin/bash
# script to run openclaw gateway for agency-v1
echo "Starting OpenClaw Gateway for Agency-v1..."

# Ensure we have the gateway URL and secret
export OPENCLAW_GATEWAY_PORT=18789
export OPENCLAW_GATEWAY_SECRET=${OPENCLAW_GATEWAY_SECRET:-"agency_v1_secret_key"}

# Assuming openclaw is installed globally or in the workspace
if command -v openclaw &> /dev/null
then
    echo "OpenClaw found in PATH."
    openclaw gateway --port $OPENCLAW_GATEWAY_PORT --verbose
else
    echo "OpenClaw not found in PATH. Please run: npm install -g openclaw@latest"
    echo "Then run this script again."
    exit 1
fi
