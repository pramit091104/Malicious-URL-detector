# Stage 1: Build the React Application
FROM node:20-alpine AS builder
WORKDIR /app

# Install heavy system tools required for native C++ SQLite compilation fallback
RUN apk update && apk add --no-cache python3 make g++

# 4. Copy package files first to leverage Docker cache
COPY package*.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# 5. Install dependencies
RUN npm install

# 6. Copy source and build
COPY . .
RUN cd frontend && npm run build

# Stage 2: Serve via Nginx with API reverse-proxy
FROM nginx:alpine AS runner

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy only the compiled dist folder from the builder stage
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Nginx default port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
