#!/bin/bash

# Configuration
PROJECT_PATH="/home/brijesh/projects/orchestrator"
SESSION_NAME="project"

function restart_all() {
    echo "Restarting all services..."
    tmux send-keys -t $SESSION_NAME:client C-c && sleep 1 && tmux send-keys -t $SESSION_NAME:client "cd $PROJECT_PATH/client && pnpm run dev" Enter
    tmux send-keys -t $SESSION_NAME:server C-c && sleep 1 && tmux send-keys -t $SESSION_NAME:server "cd $PROJECT_PATH/server && pnpm run dev" Enter
    tmux send-keys -t $SESSION_NAME:agent C-c && sleep 1 && tmux send-keys -t $SESSION_NAME:agent "cd $PROJECT_PATH/agent-service && bun run dev" Enter
}

function restart_client() {
    echo "Restarting client..."
    tmux send-keys -t $SESSION_NAME:client C-c && sleep 1 && tmux send-keys -t $SESSION_NAME:client "cd $PROJECT_PATH/client && pnpm run dev" Enter
}

function restart_server() {
    echo "Restarting server..."
    tmux send-keys -t $SESSION_NAME:server C-c && sleep 1 && tmux send-keys -t $SESSION_NAME:server "cd $PROJECT_PATH/server && pnpm run dev" Enter
}

function restart_agent() {
    echo "Restarting agent service..."
    tmux send-keys -t $SESSION_NAME:agent C-c && sleep 1 && tmux send-keys -t $SESSION_NAME:agent "cd $PROJECT_PATH/agent-service && bun run dev" Enter
}

case "$1" in
    "client")
        restart_client
        ;;
    "server")
        restart_server
        ;;
    "agent")
        restart_agent
        ;;
    "all"|"")
        restart_all
        ;;
    *)
        echo "Usage: $0 [client|server|agent|all]"
        exit 1
        ;;
esac