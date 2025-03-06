Thought for 3 seconds### Approval-Manager (mini-revoke)





## Overview

Approval-Manager is a comprehensive tool for managing and monitoring token approvals on Ethereum and compatible blockchains. It provides a streamlined interface for handling ERC20, ERC721, and ERC1155 token approvals, helping users secure their assets by maintaining visibility and control over smart contract permissions. The project is currently deployed on the Sepolia testnet.

---

## Table of Contents

1. [Features](#features)
2. [Deployments](#deployments)
3. [Installation](#installation)
4. [Usage](#usage)
5. [Contributing](#contributing)
6. [License](#license)
7. [Contact](#contact)


---

## Features

- **Multi-Standard Support**: Manages approvals for ERC20, ERC721, and ERC1155 tokens
- **Approval Dashboard**: Visual interface for monitoring all active approvals
- **Batch Operations**: Revoke multiple approvals in a single transaction
- **Single Revocation**: Revoke individual token approvals with ease
- **User-Friendly Display**: Clear presentation of token amounts and contract addresses
- **Cross-Chain Support**: Works across Ethereum and compatible chains
- **Sepolia Testnet Integration**: Fully functional on Sepolia testnet for testing


---

## Deployments

The Approval-Manager is currently deployed on the following networks:

### Sepolia Testnet

- **Contract Addresses**:

```plaintext
TK1: "0x483FA7f61170c19276B3DbB399e735355Ae7676a"
TK2: "0xE7B9Ede68593354aff96690600D008A40519D3CF"
TestNFT: "0x8BB5f4628d7cFf1e2c9342B064f6F1b38376f354"
ERC1155: "0x1bd10C54831F9231fDc5bD58139e2c101BE4396A"
MockSpender: "0x3C8A478ff7839e07fAF3Dac72DCa575F5d4bC608"
```


- **Frontend URL**: [https://approval-manager-git-main-memery1446s-projects.vercel.app/](https://approval-manager-git-main-memery1446s-projects.vercel.app/)


To interact with the Sepolia deployment:

1. Configure your wallet to connect to Sepolia testnet
2. Obtain Sepolia ETH from a faucet if needed
3. Visit the deployed frontend or interact directly with the smart contracts


---

## Installation

There are two ways to install and run Approval-Manager:

### Option 1: Using Pre-built Docker Image (Recommended)

This method doesn't require cloning the repository - you can directly pull and run the Docker image:

1. Ensure Docker is installed on your system
2. Pull the Docker image:

```shellscript
docker pull memery1446/approval-manager:latest
```


3. Run the container:

```shellscript
docker run -d -p 3000:3000 --name approval-app memery1446/approval-manager:latest
```


4. Access the application at `http://localhost:3000`


### Option 2: Building Locally

If you want to build the Docker image yourself or run without Docker:

1. Clone the repository:

```shellscript
git clone https://github.com/memery1446/approval-manager.git
```


2. Navigate to the project directory:

```shellscript
cd approval-manager
```


3. Either build and run with Docker:

```shellscript
# Build the Docker image
docker build -t approval-manager:local .

# Run the container
docker run -d -p 3000:3000 --name approval-app approval-manager:local
```


4. Or install and run directly:

```shellscript
# Install dependencies
npm install

# Start the application
npm start
```


5. Access the application at `http://localhost:3000`


### Updating the Docker Container

When new versions are released, update your installation with:

```shellscript
# Stop and remove the existing container
docker stop approval-app
docker rm approval-app

# Pull the latest image
docker pull memery1446/approval-manager:latest

# Run a new container with the latest image
docker run -d -p 3000:3000 --name approval-app memery1446/approval-manager:latest
```

---

## Usage

### Connecting Your Wallet

1. Access the application at `http://localhost:3000`
2. Click "Connect Wallet" and approve the connection request
3. Ensure your wallet is configured for Sepolia testnet


### Managing Approvals

1. **View Approvals**: All your active token approvals will be displayed in the dashboard
2. **Revoke Individual Approvals**: Select an approval and click "Revoke Selected"
3. **Batch Revoke**: Select multiple approvals of the same type and revoke them in a single transaction
4. **Mixed Batch Revoke**: For different token types, the application will guide you through the process


### Testing with Sample Tokens

The application is pre-configured to work with test tokens on Sepolia. You can:

1. Mint test tokens using the provided contract addresses
2. Create test approvals to experiment with the revocation features
3. Monitor the approval dashboard to see your actions reflected in real-time


---

## Contributing

We welcome contributions to Approval-Manager! Please feel free to submit pull requests or open issues to improve the project.

### Development Setup

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request


---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Contact

- Project Maintainer: Mark Emery
- GitHub Repository: [memery1446/approval-manager](https://github.com/memery1446/approval-manager)
- Issues: [Report Bug](https://github.com/memery1446/approval-manager/issues)

