#!/usr/bin/env bash

# Default to CET if no TIMEZONE env variable is set
echo "Setting time zone to ${TIMEZONE=Europe/Zurich}"
# This only works on Debian-based images
echo "${TIMEZONE}" > /etc/timezone
ln -fs /usr/share/zoneinfo/`cat /etc/timezone` /etc/localtime
dpkg-reconfigure -f noninteractive tzdata

echo "Configuring ALSA output device..."

ASOUNDRC_PATH="/home/chromium/.asoundrc"
# Default to Analog if variable is not set or invalid
TARGET_CARD=0
TARGET_DEVICE=0 # Default to Analog (3.5mm)

if [[ "$AUDIO_OUTPUT_DEVICE" == "HDMI" ]]; then
  echo "Selecting primary HDMI output (assuming card 0, device 3)."
  TARGET_DEVICE=3
elif [[ "$AUDIO_OUTPUT_DEVICE" == "ANALOG" ]]; then
  echo "Selecting Analog output (card 0, device 0)."
  TARGET_DEVICE=0
# Check if the input is a number (integer)
elif [[ "$AUDIO_OUTPUT_DEVICE" =~ ^[0-9]+$ ]]; then
  echo "Selecting output based on provided device number: $AUDIO_OUTPUT_DEVICE (assuming card 0)."
  TARGET_DEVICE=$AUDIO_OUTPUT_DEVICE
else
  echo "Unknown or unset AUDIO_OUTPUT_DEVICE value '$AUDIO_OUTPUT_DEVICE'. Defaulting to Analog (card 0, device 0)."
  TARGET_DEVICE=0
fi

# Write the .asoundrc file (only if TARGET_DEVICE is set)
if [[ -n "$TARGET_DEVICE" ]]; then
  cat <<EOF > "$ASOUNDRC_PATH"
  pcm.!default {
    type hw
    card $TARGET_CARD
    device $TARGET_DEVICE
  }

  ctl.!default {
    type hw
    card $TARGET_CARD
  }
EOF

 # Ensure the chromium user owns the file
  id -u chromium &>/dev/null || useradd chromium -m -s /bin/bash -G root
  chown chromium:chromium "$ASOUNDRC_PATH"
  echo "ALSA configuration written to $ASOUNDRC_PATH for card $TARGET_CARD device $TARGET_DEVICE"
else
  echo "Error: Could not determine target ALSA device. No .asoundrc file written."
  # Consider if you want the script to exit here if config fails
fi

echo "Setting default ALSA volumes and unmuting channels for card $TARGET_CARD..."
  # Use amixer to set volume and unmute.
  # The '-c $TARGET_CARD' ensures we target the correct sound card.
  # The 'sset' command sets a simple control.
  # We set a percentage volume and explicitly 'unmute'.
  # Using '|| true' ensures the script doesn't exit if a specific control doesn't exist (e.g., some NUCs might not have 'Speaker').
  amixer -c $TARGET_CARD sset Master 85% unmute || true
  amixer -c $TARGET_CARD sset Headphone 85% unmute || true # Often the key control for 3.5mm
  amixer -c $TARGET_CARD sset PCM 100% unmute || true    # PCM usually best at 100%
  # Optional: Include 'Speaker' if relevant for your NUCs, otherwise safe to ignore or remove
  # amixer -c $TARGET_CARD sset Speaker 85% unmute || true

  echo "ALSA volume configuration attempted."

# Check for connected USB devices
echo "Checking for connected USB devices:"
lsusb

# ============================================
# RustDesk Remote Access Setup
# ============================================
configure_rustdesk() {
  echo "=== RustDesk Configuration ==="

  # Wait for X11 to be ready
  echo "Waiting for X11 to be ready..."
  for i in {1..30}; do
    if [[ -e /tmp/.X11-unix/X0 ]]; then
      echo "X11 is ready!"
      break
    fi
    sleep 1
  done

  # Additional wait for stability
  sleep 5

  export DISPLAY=:0

  # Allow root to access X11 display (owned by chromium user)
  xhost +local: 2>/dev/null || true
  export XAUTHORITY=/home/chromium/.Xauthority

  # Configure custom relay server if provided
  if [[ -n "${RUSTDESK_SERVER}" ]] && [[ "${RUSTDESK_SERVER}" != "" ]]; then
    echo "Configuring RustDesk server: ${RUSTDESK_SERVER}"
    # RustDesk config format: id_server,relay_server,api_server,key
    if [[ -n "${RUSTDESK_KEY}" ]]; then
      rustdesk --config "${RUSTDESK_SERVER},${RUSTDESK_SERVER},,${RUSTDESK_KEY}" 2>&1 || true
    fi
  else
    echo "Using public RustDesk servers (no custom server configured)"
  fi

  # Set permanent password for unattended access
  if [[ -n "$RUSTDESK_PASSWORD" ]]; then
    echo "Setting RustDesk password..."
    rustdesk --password "$RUSTDESK_PASSWORD" 2>&1 || true
    echo "Password set complete"
  fi

  # Start RustDesk with display (keeps running in background)
  echo "Starting RustDesk with DISPLAY=:0..."
  DISPLAY=:0 rustdesk &
  sleep 3

  # Get and display the RustDesk ID
  sleep 5
  echo "============================================"
  echo "RustDesk ID: $(rustdesk --get-id 2>/dev/null || echo 'unavailable')"
  echo "============================================"
}

if [[ "$RUSTDESK_ENABLED" == "1" ]] || [[ "$RUSTDESK_ENABLED" == "true" ]]; then
  echo "Starting RustDesk..."

  # Create RustDesk config directories
  mkdir -p /root/.config/rustdesk
  mkdir -p /root/.local/share/rustdesk
  mkdir -p /root/Documents

  # Enable headless mode (required for Linux without GUI login)
  rustdesk --option allow-linux-headless Y 2>/dev/null || true

  # Run configuration in background (will wait for X11, then start RustDesk)
  configure_rustdesk &

  echo "RustDesk will start after X11 is ready."
else
  echo "RustDesk disabled (set RUSTDESK_ENABLED=1 to enable)"
fi

# this allows chromium sandbox to run, see https://github.com/balena-os/meta-balena/issues/2319
sysctl -w user.max_user_namespaces=10000

# Run balena base image entrypoint script
/usr/bin/entry.sh echo "Running balena base image entrypoint..."

export DBUS_SYSTEM_BUS_ADDRESS=unix:path=/host/run/dbus/system_bus_socket

sed -i -e 's/console/anybody/g' /etc/X11/Xwrapper.config
echo "needs_root_rights=yes" >> /etc/X11/Xwrapper.config
dpkg-reconfigure xserver-xorg-legacy

echo "balenaBlocks browser version: $(<VERSION)"

# this stops the CPU performance scaling down
echo "Setting CPU Scaling Governor to 'performance'"
echo 'performance' > /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor 

# check if display number envar was set
if [[ -z "$DISPLAY_NUM" ]]
  then
    export DISPLAY_NUM=0
fi

# set whether to show a cursor or not
if [[ ! -z $SHOW_CURSOR ]] && [[ "$SHOW_CURSOR" -eq "1" ]]
  then
    export CURSOR=''
    echo "Enabling cursor"
  else
    export CURSOR='-- -nocursor'
    echo "Disabling cursor"
fi

# If the vcgencmd is supported (i.e. RPi device) - check enough GPU memory is allocated
if command -v vcgencmd &> /dev/null
then
	echo "Checking GPU memory"
    if [ "$(vcgencmd get_mem gpu | grep -o '[0-9]\+')" -lt 128 ]
	then
	echo -e "\033[91mWARNING: GPU MEMORY TOO LOW"
	fi
fi

# set up the user data area
mkdir -p /data/chromium
chown -R chromium:chromium /data
rm -f /data/chromium/SingletonLock

# Set X11 environment variables
export XAUTHORITY=/home/chromium/.Xauthority
touch $XAUTHORITY
chown chromium:chromium $XAUTHORITY

# We're now using a direct MJPEG streaming approach
# No need to set up the camera here as it's handled by the Node.js server

# we can't maintain the environment with su, because we are logging in to a new session
# so we need to manually pass in the environment variables to maintain, in a whitelist
# This gets the current environment, as a comma-separated string
environment=$(env | grep -v -w '_' | awk -F= '{ st = index($0,"=");print substr($1,0,st) ","}' | tr -d "\n")
# remove the last comma
environment="${environment::-1}"

# launch Chromium and whitelist the enVars so that they pass through to the su session
su -w $environment -c "export DISPLAY=:$DISPLAY_NUM && startx /usr/src/app/startx.sh $CURSOR" - chromium
balena-idle