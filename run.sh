#!/bin/bash

# Start docker and wait for containers to be ready
docker compose up -d
echo "Waiting for postgres to be ready..."
until docker exec postgres_db pg_isready -U postgres 2>/dev/null; do
  echo "Postgres is starting..."
  sleep 2
done
echo "Postgres is ready!"

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

# If either process exits, the script will clean up and stop docker
trap "echo 'Stopping all processes'; kill $SERVER_PID $NEXTJS_APP_PID; docker-compose down" EXIT