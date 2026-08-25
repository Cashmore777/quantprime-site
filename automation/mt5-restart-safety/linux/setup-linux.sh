#!/bin/bash
# MT5 Restart Safety - Linux Setup
# Run with sudo

echo "=========================================="
echo "MT5 Restart Safety Setup (Linux)"
echo "=========================================="
echo

# Create directory
mkdir -p /opt/mt5-watchdog

# Copy scripts
cp mt5-watchdog.sh /opt/mt5-watchdog/
chmod +x /opt/mt5-watchdog/mt5-watchdog.sh

# Install systemd service
cp mt5-watchdog.service /etc/systemd/system/

# Install Xvfb if not present
if ! command -v Xvfb &> /dev/null; then
    echo "Installing Xvfb..."
    apt-get update && apt-get install -y xvfb
fi

# Reload systemd
systemctl daemon-reload

# Enable service to start on boot
systemctl enable mt5-watchdog

# Start service now
systemctl start mt5-watchdog

echo
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo
echo "Service status:"
systemctl status mt5-watchdog --no-pager
echo
echo "Commands:"
echo "  sudo systemctl status mt5-watchdog   - Check status"
echo "  sudo systemctl restart mt5-watchdog  - Restart"
echo "  sudo journalctl -u mt5-watchdog -f   - View logs"
echo
echo "Next steps:"
echo "  1. Update MT5_PATH in /opt/mt5-watchdog/mt5-watchdog.sh"
echo "  2. Update WINE_PREFIX if different"
echo "  3. Configure MT5 chart templates with EAs"
echo
