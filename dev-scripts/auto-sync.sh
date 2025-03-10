#!/bin/bash

# Configuration
ARCH_HOST="brijesh@localhost"
LOCAL_PROJECT_PATH="/Users/brijesh/projects/ongoing/orchestrator"
REMOTE_PROJECT_PATH="/home/brijesh/projects/orchestrator"
DIRS_TO_WATCH=("client" "server" "agent-service" "dev-scripts")

# Rsync options from your command
RSYNC_OPTS="-az --info=progress2 --exclude=**/node_modules --exclude=**/.next --exclude=**/.git"

# Get current date and time in UTC with the requested format
CURRENT_DATE=$(date -u '+%Y-%m-%d %H:%M:%S')
CURRENT_USER=$(whoami)

echo "Auto-Sync Starting"
echo "Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): $CURRENT_DATE"
echo "Current User's Login: $CURRENT_USER"

# Install fswatch if not already installed
if ! command -v fswatch &> /dev/null; then
    echo "fswatch not found, installing..."
    brew install fswatch
fi

# Function to sync a specific directory
sync_directory() {
    local dir=$1

    # Get current date and time for this sync operation
    local sync_time=$(date -u '+%Y-%m-%d %H:%M:%S')
    echo "[$sync_time] Changes detected in $dir, syncing..."

    # Use the same rsync options as your manual command
    rsync $RSYNC_OPTS "$LOCAL_PROJECT_PATH/$dir/" "$ARCH_HOST:$REMOTE_PROJECT_PATH/$dir/"

    # Restart the appropriate service
    if [ "$2" = "restart" ]; then
        restart_service "$dir"
    fi
}

# Function to restart a specific service
restart_service() {
    local dir=$1
    local restart_time=$(date -u '+%Y-%m-%d %H:%M:%S')
    echo "[$restart_time] Restarting $dir service..."

    case "$dir" in
        "client")
            ssh "$ARCH_HOST" "$REMOTE_PROJECT_PATH/dev-scripts/restart-services.sh client"
            ;;
        "server")
            ssh "$ARCH_HOST" "$REMOTE_PROJECT_PATH/dev-scripts/restart-services.sh server"
            ;;
        "agent-service")
            ssh "$ARCH_HOST" "$REMOTE_PROJECT_PATH/dev-scripts/restart-services.sh agent"
            ;;
        "dev-scripts")
            # Just sync the scripts without restarting anything
            echo "[$restart_time] Development scripts updated"
            # Make the scripts executable after sync
            ssh "$ARCH_HOST" "chmod +x $REMOTE_PROJECT_PATH/dev-scripts/*.sh"
            ;;
    esac
}

# Initialize one-time full sync
echo "Performing initial full sync of all directories..."
for dir in "${DIRS_TO_WATCH[@]}"; do
    echo "Initial sync of $dir..."
    rsync $RSYNC_OPTS "$LOCAL_PROJECT_PATH/$dir/" "$ARCH_HOST:$REMOTE_PROJECT_PATH/$dir/"
done

# Make sure remote scripts are executable
ssh "$ARCH_HOST" "chmod +x $REMOTE_PROJECT_PATH/dev-scripts/*.sh"

# Start watching directories for changes with selective filters
for dir in "${DIRS_TO_WATCH[@]}"; do
    echo "Watching $dir for changes..."

    # Common exclusion patterns for all directories
    EXCLUDE_PATTERNS=(
        "--exclude" "*/\\.git/*"
        "--exclude" "*/\\.git"
        "--exclude" "*/node_modules/*"
        "--exclude" "*/node_modules"
    )

    # Add .next exclusion only for client directory
    if [ "$dir" = "client" ]; then
        EXCLUDE_PATTERNS+=(
            "--exclude" "*/\\.next/*"
            "--exclude" "*/\\.next"
        )
    fi

    # Use fswatch with these exclusions
    # -o outputs events as they occur
    # -e exclude patterns with regex
    # -l latency in seconds (increasing slightly to reduce CPU usage)
    fswatch -o -l 0.5 "${EXCLUDE_PATTERNS[@]}" "$LOCAL_PROJECT_PATH/$dir" | while read; do
        sync_directory "$dir" "restart"
    done &
done

echo "Auto-sync running. Press Ctrl+C to stop."
wait
