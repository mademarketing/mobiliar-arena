#!/bin/bash

# Default to CET if no TIMEZONE env variable is set
echo "Setting time zone to ${TIMEZONE=Europe/Zurich}"
# This only works on Debian-based images
echo "${TIMEZONE}" > /etc/timezone
ln -fs /usr/share/zoneinfo/`cat /etc/timezone` /etc/localtime
dpkg-reconfigure -f noninteractive tzdata

export DBUS_SYSTEM_BUS_ADDRESS=unix:path=/host/run/dbus/system_bus_socket
sleep 10

echo "Starting up node"
CLIENT=$CLIENT node ./dist/server/app.js
