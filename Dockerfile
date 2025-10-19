# --- Stage 1: Install dependencies ---
FROM node:20-slim AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# --- Stage 2: Production runtime ---
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Install only prod dependencies
COPY --from=build /app/package*.json ./
RUN npm install --omit=dev

# Copy built app from build stage
COPY --from=build /app .

EXPOSE 8080

CMD ["npm", "start"]