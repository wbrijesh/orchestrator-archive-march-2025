#!/bin/bash

# Configuration
PROJECT_PATH="/home/brijesh/projects/orchestrator"
SESSION_NAME="project"

# Kill existing session if it exists
tmux kill-session -t $SESSION_NAME 2>/dev/null

# Create new session
tmux new-session -d -s $SESSION_NAME

# Create client window
tmux rename-window -t $SESSION_NAME:0 'client'
tmux send-keys -t $SESSION_NAME:client "cd $PROJECT_PATH/client && pnpm run dev" Enter

# Create server window
tmux new-window -t $SESSION_NAME -n 'server'
tmux send-keys -t $SESSION_NAME:server "cd $PROJECT_PATH/server && pnpm run dev" Enter

# Create agent-service window
tmux new-window -t $SESSION_NAME -n 'agent'
tmux send-keys -t $SESSION_NAME:agent "cd $PROJECT_PATH/agent-service && bun run dev" Enter

echo "Tmux session '$SESSION_NAME' created with windows: client, server, agent"
echo "Attach to this session using: tmux attach -t $SESSION_NAME"