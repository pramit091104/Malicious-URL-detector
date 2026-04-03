# Stage 1: Build the React Application
FROM node:20-alpine AS builder
WORKDIR /app

# The frontend MUST know the absolute URL of the backend at build-time.
# We map the backend locally to port 4000. 
ARG VITE_API_BASE_URL=http://localhost:4000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Provide package and lockfile
COPY package*.json ./
# Provide strictly workspace required elements
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
RUN npm install

# Copy source
COPY . .

# Build the React app
RUN cd frontend && npm run build

# Stage 2: Serve the final assets via Node serve
FROM node:20-alpine AS runner
WORKDIR /app

# Install lightweight static file server globally
RUN npm install -g serve

# Copy only the compiled dist folder from the builder stage
COPY --from=builder /app/frontend/dist ./dist

# Frontend exposed on 3000
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
