FROM node:20-alpine
# Install heavy system tools required for native C++ SQLite compilation
RUN apk update && apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN npm install

COPY backend ./backend

ENV PORT=4000
EXPOSE 4000

WORKDIR /app/backend
CMD ["npm", "run", "start"]
