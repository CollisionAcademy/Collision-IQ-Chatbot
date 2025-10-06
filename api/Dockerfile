# Use official Node.js 18 image
FROM node:18-slim AS build

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .

# Optional: build step (only needed if your backend needs to compile assets)
# RUN npm run build || echo "No build step found"

# ---------- Runtime stage ----------
FROM node:18-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

# Copy only production dependencies and source
COPY --from=build /app/package*.json ./
RUN npm install --omit=dev

COPY --from=build /app .

# Expose port for Cloud Run
EXPOSE 8080

# Start the server
CMD ["npm", "start"]