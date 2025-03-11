Overview
Approval-Manager is a comprehensive tool for managing and monitoring token approvals on Ethereum and compatible blockchains. It provides a streamlined interface for handling ERC20, ERC721, and ERC1155 token approvals, helping users secure their assets by maintaining visibility and control over smart contract permissions. The project is currently deployed on the Sepolia testnet.

## Getting Started ##

# Clone the Repository

git clone https://github.com/memery1446/approval-manager.git 

# Navigate to the project directory and install dependencies

cd approval-manager
npm install

# Add a .env file and fill it in based on the .env.example file

touch .env

# Stop running any Docker containers

docker stop approval-manager
docker rm approval-manager
docker rmi approval-manager

# Build the Docker image

docker build -t approval-manager .

# run the Dapp
docker run -d -p 3000:3000 --name approval-manager --env-file .env approval-manager

## To run Hardhat scripts (like approving tokens) inside the container:

# Enter the container:

docker exec -it approval-app bash

# Set your private key:

export PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Run your script:

npx hardhat run scripts/approveOnly.js --network sepolia


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
        TK1: "0x2B042eF97864f2B78309BEE80Af70Aea6FFcDc79",
        TK2: "0x50AE7C0a775b2fC8Cb4089CE9F9aa3ffEc341f7b",
        TestNFT: "0xDd81A953804F8DE4942cC2DF51FC7dc7273112E2",
        ERC1155: "0xDDC69cbaD475C1477d6D7fdF7CA8580f75EC53EF",
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
docker stop approval-manager

Contact

Project Maintainer: Mark Emery
GitHub Repository: memery1446/approval-manager