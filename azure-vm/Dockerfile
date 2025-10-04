FROM node:18-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy Remotion project
COPY remotion/ ./remotion/

# Copy server files
COPY server.js ./

# Create output directory
RUN mkdir -p /app/output

# Expose port
EXPOSE 3001

# Start the server
CMD ["node", "server.js"]
