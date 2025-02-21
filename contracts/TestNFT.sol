// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract TestNFT is ERC721 {
    constructor() ERC721("TestNFT", "TNFT") {
        _mint(msg.sender, 1);
        _mint(msg.sender, 2);
        _mint(msg.sender, 3);
    }

    /**
     * @dev Explicitly override OpenZeppelin's function to ensure ABI includes it.
     */
    function isApprovedForAll(address owner, address operator) public view override returns (bool) {
        return super.isApprovedForAll(owner, operator);
    }

    /**
     * @dev Allows the owner to batch revoke approvals for multiple token IDs.
     */
    function batchRevokeApprovals(uint256[] memory tokenIds) external {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(ownerOf(tokenIds[i]) == msg.sender, "Not owner of token");
            approve(address(0), tokenIds[i]); // ✅ Revoke approval by setting it to Zero Address
        }
    }
}

