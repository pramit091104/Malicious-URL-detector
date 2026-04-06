# Stage 1: Build the React Application
FROM node:20-alpine AS builder
WORKDIR /app

# Install heavy system tools required for native C++ SQLite compilation fallback
RUN apk update && apk add --no-cache python3 make g++
# ARG VITE_API_BASE_URL=http://localhost:4000
# ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

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

# Stage 2: Serve the final assets via Nginx
FROM nginx:alpine AS runner

# Remove default nginx config to avoid conflicts
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom Nginx proxy configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/

# Copy only the compiled dist folder from the builder stage
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Frontend exposed on 3000
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
