#!/bin/bash

# Set fleet environment variables for beda/swisslos-win-for-life
# Run this after deploying to the fleet so services exist

FLEET="beda/swisslos-win-for-life"

echo "Setting environment variables for fleet: $FLEET"

# Browser service variables
echo "Setting browser service variables..."
balena env set AUDIO_OUTPUT_DEVICE "hw:0,3" --fleet "$FLEET" --service browser
balena env set ENABLE_GPU "1" --fleet "$FLEET" --service browser
balena env set FORCE_HD "1" --fleet "$FLEET" --service browser
balena env set KIOSK "1" --fleet "$FLEET" --service browser
balena env set LAUNCH_URL "localhost:3000" --fleet "$FLEET" --service browser
balena env set ROTATE_DISPLAY "normal" --fleet "$FLEET" --service browser
balena env set SHOW_CURSOR "0" --fleet "$FLEET" --service browser
balena env set WINDOW_SIZE "1920,1080" --fleet "$FLEET" --service browser

# RustDesk remote access variables
echo "Setting RustDesk variables..."
balena env set RUSTDESK_ENABLED "1" --fleet "$FLEET" --service browser
# Note: Set RUSTDESK_PASSWORD per-device for security, not fleet-wide
# balena env set RUSTDESK_PASSWORD "your_password" --device <device-uuid> --service browser
# Optional: Set custom relay server (leave empty to use public RustDesk servers)
# balena env set RUSTDESK_SERVER "your-server.com" --fleet "$FLEET" --service browser
# balena env set RUSTDESK_KEY "your_public_key" --fleet "$FLEET" --service browser

# Nodeapp service variables
echo "Setting nodeapp service variables..."
balena env set NODE_ENV "production" --fleet "$FLEET" --service nodeapp
balena env set CMS_URL "http://localhost" --fleet "$FLEET" --service nodeapp
balena env set PRINTER_IP "http://192.168.8.105" --fleet "$FLEET" --service nodeapp

echo "Done! Environment variables have been set."
echo ""
echo "To verify, run:"
echo "  balena env list --fleet $FLEET"
