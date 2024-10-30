# Use a base image with Bun installed
FROM oven/bun:alpine

# Set the working directory
WORKDIR /app

# Copy package.json and bun.lockb
COPY package.json bun.lockb ./

RUN bun install

COPY . .

# Command to run your application
CMD ["bun", "run", "dev"]
