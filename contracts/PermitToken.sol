// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

// PermitToken (EIP-2612 approval via signatures)
contract PermitToken is ERC20Permit, ERC20Burnable {
    constructor(string memory name, string memory symbol, uint8 decimals)
        ERC20(name, symbol)
        ERC20Permit(name)
    {
        _mint(msg.sender, 1000000 * 10**decimals);
    }
}

