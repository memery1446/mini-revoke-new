# Use Node.js 18 as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (helps with caching)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the project to the container, excluding .env file
# First, create a .dockerignore file in your project root with ".env" in it
# Or use the more specific copy approach below
COPY src/ ./src/
COPY public/ ./public/
COPY next.config.js ./
COPY jsconfig.json ./
COPY .eslintrc.json ./
COPY tsconfig.json ./
# Add any other necessary project files/directories

# Define ARG instructions for build-time variables
ARG SEPOLIA_RPC_URL
ARG INFURA_API_KEY
ARG ALCHEMY_API_KEY
ARG ETHERSCAN_API_KEY
ARG CMC_API_KEY
ARG PRIVATE_KEY

# Pass environment variables to the container
ENV SEPOLIA_RPC_URL=${SEPOLIA_RPC_URL}
ENV INFURA_API_KEY=${INFURA_API_KEY}
ENV ALCHEMY_API_KEY=${ALCHEMY_API_KEY}
ENV ETHERSCAN_API_KEY=${ETHERSCAN_API_KEY}
ENV CMC_API_KEY=${CMC_API_KEY}
ENV PRIVATE_KEY=${PRIVATE_KEY}

# Add Next.js/React client-side environment variables
ENV NEXT_PUBLIC_SEPOLIA_RPC_URL=${SEPOLIA_RPC_URL}
ENV NEXT_PUBLIC_INFURA_API_KEY=${INFURA_API_KEY}
ENV REACT_APP_ALCHEMY_SEPOLIA_URL=${SEPOLIA_RPC_URL}

# Build the application
RUN npm run build

# Expose the port your app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

