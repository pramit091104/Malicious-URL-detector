FROM node:20-slim
# Install heavy system tools required for native C++ SQLite compilation
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN npm install

COPY backend ./backend

# Pre-cache the Hugging Face ONNX Model during Docker build
RUN cd backend && npx tsx -e "import { getModelPrediction } from './src/lib/mlModel.js'; getModelPrediction('http://example.com').then(() => process.exit(0));"

EXPOSE 3000

WORKDIR /app/backend
CMD ["npm", "run", "start"]
