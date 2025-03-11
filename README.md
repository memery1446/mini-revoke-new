Overview
Approval-Manager is a comprehensive tool for managing and monitoring token approvals on Ethereum and compatible blockchains. It provides a streamlined interface for handling ERC20, ERC721, and ERC1155 token approvals, helping users secure their assets by maintaining visibility and control over smart contract permissions. The project is currently deployed on the Sepolia testnet.
Getting Started
Clone the Repository
First, clone the repository to your local machine:
shellCopy# Clone the repository
git clone https://github.com/memery1446/approval-manager.git

# Navigate to the project directory
cd approval-manager
Quick Start with Docker
To run the latest version of the application:
shellCopy# Pull the latest image
docker pull memery1446/approval-manager:latest

# If you already have a container running, stop and remove it
docker stop approval-app
docker rm approval-app

# Run the container with required environment variables
docker run -d -p 3000:3000 --name approval-app \
  -e SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_KEY" \
  -e INFURA_API_KEY="YOUR_INFURA_KEY" \
  -e ALCHEMY_API_KEY="YOUR_ALCHEMY_KEY" \
  -e ETHERSCAN_API_KEY="YOUR_ETHERSCAN_KEY" \
  -e PRIVATE_KEY="YOUR_PRIVATE_KEY" \
  memery1446/approval-manager:latest
Then access the application at http://localhost:3000
Building the Docker Image
To build your own image from the cloned repository:
shellCopy# Make sure you're in the project directory
cd approval-manager

# Build the Docker image
docker build \
  --build-arg SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_KEY" \
  --build-arg INFURA_API_KEY="YOUR_INFURA_KEY" \
  --build-arg ALCHEMY_API_KEY="YOUR_ALCHEMY_KEY" \
  --build-arg ETHERSCAN_API_KEY="YOUR_ETHERSCAN_KEY" \
  --build-arg PRIVATE_KEY="YOUR_PRIVATE_KEY" \
  --build-arg CMC_API_KEY="YOUR_CMC_KEY" \
  -t approval-manager .
Note: For security, consider using Docker secrets or a secure vault solution for sensitive values like PRIVATE_KEY in production environments.
Running Scripts in Docker
To run Hardhat scripts (like approving tokens) inside the container:

Enter the container:
bashCopydocker exec -it approval-app bash

Set your private key:
bashCopyexport PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

Run your script:
bashCopynpx hardhat run scripts/Approve2ofEach.js --network sepolia


Note: For security, avoid storing private keys in files or sharing them in commands. Use environment variables or Docker secrets for production environments.
Features

Multi-Standard Support: Manages approvals for ERC20, ERC721, and ERC1155 tokens
Approval Dashboard: Visual interface for monitoring all active approvals
Batch Operations: Revoke multiple approvals in a single transaction
Single Revocation: Revoke individual token approvals with ease
User-Friendly Display: Clear presentation of token amounts and contract addresses
Cross-Chain Support: Works across Ethereum and compatible chains
Sepolia Testnet Integration: Fully functional on Sepolia testnet for testing

Deployments
The Approval-Manager is currently deployed on the Sepolia testnet:
Sepolia Test Contracts
CopyTK1: "0x483FA7f61170c19276B3DbB399e735355Ae7676a"
TK2: "0xE7B9Ede68593354aff96690600D008A40519D3CF"
TestNFT: "0x8BB5f4628d7cFf1e2c9342B064f6F1b38376f354"
ERC1155: "0x1bd10C54831F9231fDc5bD58139e2c101BE4396A"
MockSpender: "0x3C8A478ff7839e07fAF3Dac72DCa575F5d4bC608"

Frontend URL: https://approval-manager-git-main-memery1446s-projects.vercel.app/

Usage

Connect your wallet (configured for Sepolia testnet)
View your active approvals in the dashboard
Select approvals and click "Revoke Selected" to revoke them
For batch operations, select multiple approvals of the same type
For mixed token types, the application will guide you through the process

Docker Management Commands
Option 1: Remove the existing container first (recommended)
shellCopy# First, stop the container if it's running
docker stop approval-app

# Then remove it
docker rm approval-app

# Now you can run the new container (see Quick Start section)
Option 2: Use a different name for the new container
shellCopy# Run with a different name
docker run -d -p 3000:3000 --name approval-app-new \
  -e SEPOLIA_RPC_URL="https://sepolia.infura.io/v3/YOUR_INFURA_KEY" \
  -e INFURA_API_KEY="YOUR_INFURA_KEY" \
  -e ALCHEMY_API_KEY="YOUR_ALCHEMY_KEY" \
  -e ETHERSCAN_API_KEY="YOUR_ETHERSCAN_KEY" \
  -e PRIVATE_KEY="YOUR_PRIVATE_KEY" \
  memery1446/approval-manager:latest
Option 3: Start the existing container if it's stopped
shellCopy# Check if the container exists but is stopped
docker ps -a | grep approval-app

# Start the existing container
docker start approval-app
Troubleshooting

Connection Issues: If the application can't connect to the blockchain, ensure you've provided valid API keys in your Docker run command
Script Errors: When running scripts inside the container, make sure you've set your private key with export PRIVATE_KEY=0xYOUR_KEY
Container Access: Use docker logs approval-app to view application logs for debugging

Contact

Project Maintainer: Mark Emery
GitHub Repository: memery1446/approval-manager