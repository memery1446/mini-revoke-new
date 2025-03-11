# Use a base Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json first (for caching)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the entire project
COPY . .

# Load environment variables from .env file
ENV SEPOLIA_RPC_URL=${SEPOLIA_RPC_URL}
ENV TOKEN_API_URL=https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}/getTokenBalances
ENV NFT_API_URL=https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}
ENV INFURA_API_KEY=${INFURA_API_KEY}
ENV ALCHEMY_API_KEY=${ALCHEMY_API_KEY}
ENV ETHERSCAN_API_KEY=${ETHERSCAN_API_KEY}
ENV PRIVATE_KEY=${PRIVATE_KEY}
ENV CMC_API_KEY=${CMC_API_KEY}

# Build the application
RUN npm run build

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

