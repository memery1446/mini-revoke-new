# Approval-Manager (mini-revoke)

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Overview

Approval-Manager is a comprehensive tool for managing and monitoring token approvals on Ethereum and compatible blockchains. It provides a streamlined interface for handling ERC20, ERC721, and ERC1155 token approvals, helping users secure their assets by maintaining visibility and control over smart contract permissions. The project is currently deployed on the Sepolia testnet.

---

## Deployments

The Approval-Manager is currently deployed on the following networks:

### Sepolia Testnet
- Contract Addresses: 

        TK1: "0x483FA7f61170c19276B3DbB399e735355Ae7676a",
        TK2: "0xE7B9Ede68593354aff96690600D008A40519D3CF",
        TestNFT: "0x8BB5f4628d7cFf1e2c9342B064f6F1b38376f354",
        ERC1155: "0x1bd10C54831F9231fDc5bD58139e2c101BE4396A",
        MockSpender: "0x3C8A478ff7839e07fAF3Dac72DCa575F5d4bC608"

- Frontend URL: [https://approval-manager-sepolia.example.com](https://approval-manager-git-main-memery1446s-projects.vercel.app/) 


To interact with the Sepolia deployment:
1. Configure your wallet to connect to Sepolia testnet
2. Obtain Sepolia ETH from a faucet if needed
3. Visit the deployed frontend or interact directly with the smart contract

---

## Table of Contents

1. [Installation](#installation)
2. [Usage](#usage)
3. [Features](#features)
4. [Deployments](#deployments)
5. [Contributing](#contributing)
6. [License](#license)
7. [Contact](#contact)

---

## Installation

To get started with Approval-Manager, you can either install it directly or use our Docker image.

### Prerequisites

- Node.js
- React 18+
- Hardhat
- Ethers.js v6
- Docker

### Docker Installation (Recommended)

The simplest way to run Approval-Manager is using Docker:

1. Pull the Docker image:
    ```bash
    docker pull memery1446/approval-manager:latest
    ```

2. Run the container:
    ```bash
    docker run -p 3000:3000 memery1446/approval-manager:latest
    ```

3. Access the application at `http://localhost:3000`

### Manual Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/yourusername/approval-manager.git
    ```

2. Navigate to the project directory:
    ```bash
    cd approval-manager
    ```

3. Install dependencies:
    ```bash
    npm install
    ```

4. Start the application:
    ```bash
    npm start
    ```

---

## Usage

Approval-Manager provides a web interface for managing token approvals. Here's how to use the main features:

### Web Interface

After starting the application, access the web interface at `http://localhost:3000`. From there you can:

1. Connect your wallet (MetaMask or other Web3 wallets)
2. Run scripts to approve test tokens
3. View all active approvals for ERC20, ERC721, and ERC1155 tokens
4. Revoke unnecessary approvals, singly or in a batch up to five
5. Monitor approval activity

### API Usage

- **Update .env file**

## Features

- **Multi-Standard Support**: Manages approvals for ERC20, ERC721, and ERC1155 tokens
- **Approval Dashboard**: Visual interface for monitoring all active approvals
- **Batch Operations**: Revoke multiple approvals in a single transaction
- **Risk Assessment**: Identifies potentially risky approvals
- **Historical Tracking**: View history of past approvals and revocations
- **Notification System**: Alerts for new approvals or suspicious activity
- **Cross-Chain Support**: Works across Ethereum and compatible chains
- **Education Portal**: Genuinely care about the user's safety - educate with key points

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

- Project Maintainer: [Your Name](mailto:your.email@example.com)
- GitHub Issues: [Report Bug](https://github.com/yourusername/approval-manager/issues)
- Twitter: [@YourTwitterHandle](https://twitter.com/YourTwitterHandle)


