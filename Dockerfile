# Use Node as the base image
FROM node:20-alpine

# Install system dependencies required for compiling native node modules (like better-sqlite3)
RUN apk update && apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy root and workspace package.json files
COPY package.json package-lock.json* ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Install all dependencies (NPM Workspaces will map everything correctly)
RUN npm install

# Copy everything else
COPY . .

# Build the frontendReact app
RUN cd frontend && npm run build

# Verify backend TypeScript Types
RUN cd backend && npx tsc --noEmit

# Expose backend port
EXPOSE 4000

# Move to the backend folder and start the server
WORKDIR /app/backend
CMD ["npm", "run", "start"]
