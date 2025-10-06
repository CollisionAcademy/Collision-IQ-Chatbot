# Root-level Dockerfile for backend API in ./api
FROM node:18-slim

WORKDIR /app

# Copy only backend
COPY api/package*.json ./ 
RUN npm install --omit=dev

# Copy the rest of the API
COPY api ./api

WORKDIR /app/api
EXPOSE 8080
CMD ["npm", "start"]