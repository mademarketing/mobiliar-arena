---
allowed-tools: Bash
description: Start backend (port 3000) and frontend (port 8000) in background processes
---

# Purpose

Start both game server and client in background processes for local development.

## Instructions

- Start the node backend on port 3000 using npm
- Start the phaser frontend on port 8000 using npm
- Run both as background processes so they persist
- Report the running processes to the user

## Workflow

1. Start backend: `cd docker/app/server && npm run start` (background)
2. Start frontend: `cd docker/app/client && npm run dev` (background)
3. Report both processes are running with access URL
4. Open chrome against the frontend URL

## Report

Confirm both services started with: Backend at http://localhost:3000, Frontend at http://localhost:8000
