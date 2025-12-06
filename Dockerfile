# Dockerfile for Railway deployment
# This ensures ONLY the main app is deployed, ignoring subdirectories

FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Copy the q402-snapshot dependency (needed for local file: reference)
COPY q402-snapshot/packages/core ./q402-snapshot/packages/core

# Install backend dependencies
RUN npm install --legacy-peer-deps

# Copy frontend package files
COPY frontend/package.json frontend/package-lock.json ./frontend/

# Install frontend dependencies
RUN cd frontend && npm install --legacy-peer-deps

# Copy all source code
COPY src ./src
COPY frontend/src ./frontend/src
COPY frontend/public ./frontend/public
COPY frontend/index.html ./frontend/
COPY frontend/vite.config.js ./frontend/
COPY frontend/eslint.config.js ./frontend/

# Build frontend
RUN cd frontend && npm run build

# Expose port (Railway sets PORT env var)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the server
CMD ["node", "src/index.js"]

