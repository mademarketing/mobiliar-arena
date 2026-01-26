#!/bin/sh

# Check if TUNNEL_TOKEN is set
if [ -z "$TUNNEL_TOKEN" ]; then
    echo "TUNNEL_TOKEN not set - cloudflared tunnel disabled"
    echo "To enable remote access, set TUNNEL_TOKEN in balena device variables"
    # Sleep forever to prevent container restart loop
    exec sleep infinity
fi

# Token is set, run cloudflared
echo "Starting cloudflared tunnel..."
exec cloudflared tunnel --no-autoupdate run
