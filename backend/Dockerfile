# Use the official Node.js 18 image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of your backend code
COPY . .

# Cloud Run uses the PORT environment variable (default 8080)
ENV PORT=8080
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]