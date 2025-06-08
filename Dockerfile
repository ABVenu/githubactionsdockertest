# Use official Node image
FROM node:22

# Install Redis
RUN apt-get update && apt-get install -y redis-server

# Set workdir
WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
RUN npm install

# Copy app code
COPY . .

# Expose the port
EXPOSE 3000

# Start Redis in background and then Node
CMD redis-server --daemonize yes && npm start


## once docker file is ready create image