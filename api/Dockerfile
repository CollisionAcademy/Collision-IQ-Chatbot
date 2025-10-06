# Small, fast, reliable
FROM node:20-alpine

# App dir
WORKDIR /app

# Install only what's needed to run
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# App source
COPY . .

# Env + port
ENV NODE_ENV=production
ENV PORT=8080

# Start the server
CMD ["node", "server.js"]
