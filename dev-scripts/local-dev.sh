#!/bin/bash

# Kill existing session if it exists
tmux kill-session -t orch 2>/dev/null

# Create a new session named 'orch' and start in project directory
cd /Users/brijesh/projects/ongoing/orchestrator
tmux new-session -d -s orch -n client

# Configure client tab
tmux send-keys -t orch:client 'cd client' C-m
tmux send-keys -t orch:client 'pnpm run dev' C-m

# Create and configure server tab
tmux new-window -t orch -n server
tmux send-keys -t orch:server 'cd server' C-m
tmux send-keys -t orch:server 'pnpm run dev' C-m

# Create and configure agent tab
tmux new-window -t orch -n agent
tmux send-keys -t orch:agent 'cd agent-service' C-m
tmux send-keys -t orch:agent 'pnpm run dev' C-m

# Create and configure shell tab
tmux new-window -t orch -n shell
tmux send-keys -t orch:shell 'sleep 5 && open http://localhost:3000' C-m

# Select the first window (client)
tmux select-window -t orch:client

# Ask user whether to attach to the session
CHOICE=$(gum choose "Attach to session" "Don't attach")
if [ "$CHOICE" = "Attach to session" ]; then
    tmux attach-session -t orch
fi
