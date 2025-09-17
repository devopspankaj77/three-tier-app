# Use Node.js base image
FROM node:18-alpine AS build

# Set environment variables
ENV NODE_OPTIONS=--openssl-legacy-provider

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json first for faster caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the app
RUN npm run build

# Use nginx to serve the app
FROM nginx:alpine

# Copy the build to nginx
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80
