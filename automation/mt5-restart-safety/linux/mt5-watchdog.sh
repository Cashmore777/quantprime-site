#!/bin/bash
# MT5 Watchdog for Linux VPS (Wine)
# Monitors MT5 terminals and restarts if crashed

# Configuration - UPDATE THESE
MT5_PATH="/home/trader/.wine/drive_c/Program Files/MetaTrader 5/terminal64.exe"
WINE_PREFIX="/home/trader/.wine"
LOG_FILE="/var/log/mt5-watchdog.log"
CHECK_INTERVAL=60

# Display settings for headless server
export DISPLAY=:99
export WINEPREFIX="$WINE_PREFIX"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

start_xvfb() {
    if ! pgrep -x "Xvfb" > /dev/null; then
        log "Starting Xvfb virtual display..."
        Xvfb :99 -screen 0 1024x768x16 &
        sleep 2
    fi
}

is_mt5_running() {
    pgrep -f "terminal64.exe" > /dev/null
    return $?
}

start_mt5() {
    log "Starting MT5..."
    
    # Start virtual display if needed
    start_xvfb
    
    # Start MT5 with Wine
    cd "$(dirname "$MT5_PATH")"
    wine64 "$MT5_PATH" /portable &
    
    # Wait for MT5 to start
    sleep 15
    
    if is_mt5_running; then
        log "MT5 started successfully (PID: $(pgrep -f terminal64.exe))"
        return 0
    else
        log "WARNING: MT5 may not have started properly"
        return 1
    fi
}

# Create log file
touch "$LOG_FILE"

log "=========================================="
log "MT5 Watchdog Started"
log "Checking every ${CHECK_INTERVAL} seconds"
log "=========================================="

# Initial start
if ! is_mt5_running; then
    start_mt5
fi

# Main watchdog loop
while true; do
    sleep $CHECK_INTERVAL
    
    if ! is_mt5_running; then
        log "ALERT: MT5 not running! Restarting..."
        start_mt5
    fi
done
