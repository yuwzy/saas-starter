FROM node:22-bookworm-slim

# Install necessary packages
RUN apt-get update && apt-get install -y \
    git \
    curl \
    ca-certificates \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Enable corepack for pnpm
RUN corepack enable

# Set up pnpm
ENV PNPM_HOME="/home/node/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Create workspace directory
RUN mkdir -p /workspace && chown -R node:node /workspace

# Set working directory
WORKDIR /workspace

# Switch to non-root user
USER node
