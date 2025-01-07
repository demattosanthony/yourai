#!/bin/bash

# Run the Express API
cd api/
bun install
bun run dev &
SERVER_PID=$!
echo "Express api started with PID $SERVER_PID"

# Run the Next.js app
cd ../frontend/
bun install
bun run dev &
NEXTJS_APP_PID=$!
echo "Next.js app started with PID $NEXTJS_APP_PID"

# Wait for both processes to complete
wait $SERVER_PID $NEXTJS_APP_PID

# If either process exits, the script will clean up
trap "echo 'Stopping both processes'; kill $SERVER_PID $NEXTJS_APP_PID" EXIT