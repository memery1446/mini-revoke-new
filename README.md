## Overview

Approval-Manager is a comprehensive tool for managing and monitoring token approvals on Ethereum and compatible blockchains. It provides a streamlined interface for handling ERC20, ERC721, and ERC1155 token approvals, helping users secure their assets by maintaining visibility and control over smart contract permissions. The project is currently deployed on the Sepolia testnet.

## Quick Start with Docker

To run the latest version of the application:

```shellscript
# Pull the latest image
docker pull memery1446/approval-manager:latest

# If you already have a container running, stop and remove it
docker stop approval-app
docker rm approval-app

# Run the new container
docker run -d -p 3000:3000 --name approval-app memery1446/approval-manager:latest
```

Then access the application at [http://localhost:3000](http://localhost:3000)

## Features

- **Multi-Standard Support**: Manages approvals for ERC20, ERC721, and ERC1155 tokens
- **Approval Dashboard**: Visual interface for monitoring all active approvals
- **Batch Operations**: Revoke multiple approvals in a single transaction
- **Single Revocation**: Revoke individual token approvals with ease
- **User-Friendly Display**: Clear presentation of token amounts and contract addresses
- **Cross-Chain Support**: Works across Ethereum and compatible chains
- **Sepolia Testnet Integration**: Fully functional on Sepolia testnet for testing


## Deployments

The Approval-Manager is currently deployed on the Sepolia testnet:

### Sepolia Test Contracts

```plaintext
TK1: "0x483FA7f61170c19276B3DbB399e735355Ae7676a"
TK2: "0xE7B9Ede68593354aff96690600D008A40519D3CF"
TestNFT: "0x8BB5f4628d7cFf1e2c9342B064f6F1b38376f354"
ERC1155: "0x1bd10C54831F9231fDc5bD58139e2c101BE4396A"
MockSpender: "0x3C8A478ff7839e07fAF3Dac72DCa575F5d4bC608"
```

- **Frontend URL**: [https://approval-manager-git-main-memery1446s-projects.vercel.app/](https://approval-manager-git-main-memery1446s-projects.vercel.app/)


## Usage

1. Connect your wallet (configured for Sepolia testnet)
2. View your active approvals in the dashboard
3. Select approvals and click "Revoke Selected" to revoke them
4. For batch operations, select multiple approvals of the same type
5. For mixed token types, the application will guide you through the process


## Contact

- Project Maintainer: Mark Emery
- GitHub Repository: [memery1446/approval-manager](https://github.com/memery1446/approval-manager)

## For Mark

### Option 1: Remove the existing container first (recommended)

```shellscript
# First, stop the container if it's running
docker stop approval-app

# Then remove it
docker rm approval-app

# Now you can run the new container
docker run -d -p 3000:3000 --name approval-app memery1446/approval-manager:latest
```

### Option 2: Use a different name for the new container

```shellscript
# Run with a different name
docker run -d -p 3000:3000 --name approval-app-new memery1446/approval-manager:latest
```

### Option 3: Start the existing container if it's stopped

If you just want to use the container you already created:

```shellscript
# Check if the container exists but is stopped
docker ps -a | grep approval-app

# Start the existing container
docker start approval-app
```

For your boss testing scenario, Option 1 is probably best as it ensures you're running the latest version of the image. This is the typical workflow when updating a Docker application.

After running these commands, you should be able to access the application at [http://localhost:3000](http://localhost:3000).
