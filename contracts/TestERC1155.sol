// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestERC1155 is ERC1155, Ownable {
    constructor(address initialOwner) ERC1155("https://api.example.com/metadata/{id}.json") Ownable(initialOwner) {
        _mint(initialOwner, 1, 100, ""); // Mint 100 units of token ID 1
        _mint(initialOwner, 2, 50, "");  // Mint 50 units of token ID 2
    }

    function mint(address to, uint256 id, uint256 amount) external onlyOwner {
        _mint(to, id, amount, "");
    }
}