# ---------- Build stage
FROM node:18-slim AS build
WORKDIR /app

# Install dependencies (including dev deps for any build step)
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# If you have a front-end build (e.g., Vite/React), run it
RUN npm run build || echo "No build script, skipping build."

# ---------- Runtime stage
FROM node:18-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Only production deps for lean runtime
COPY --from=build /app/package*.json ./
RUN npm install --omit=dev

# Bring built artifacts and server code
COPY --from=build /app ./

# Cloud Run listens on PORT (default 8080)
EXPOSE 8080

# Start the server (root app.js)
CMD ["npm", "start"]