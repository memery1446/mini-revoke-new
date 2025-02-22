// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol"; // Add this import

contract TestNFT is ERC721Enumerable, Ownable {
    constructor() ERC721("TestNFT", "TNFT") Ownable(msg.sender) {
        _mint(msg.sender, 1);
        _mint(msg.sender, 2);
        _mint(msg.sender, 3);
    }

    /**
     * @dev Explicitly override OpenZeppelin's function to ensure ABI includes it.
     */
    function isApprovedForAll(address owner, address operator) public view override(ERC721, IERC721) returns (bool) {
        return super.isApprovedForAll(owner, operator);
    }

    /**
     * @dev Allows the owner to batch revoke approvals for multiple token IDs.
     */
    function batchRevokeApprovals(uint256[] memory tokenIds) external onlyOwner {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(ownerOf(tokenIds[i]) == msg.sender, "Not owner of token");
            approve(address(0), tokenIds[i]); // ✅ Revoke approval by setting it to Zero Address
            emit ApprovalRevoked(tokenIds[i], msg.sender);
        }
    }

    /**
     * @dev Mints a new NFT to the specified address.
     */
    function safeMint(address to) public onlyOwner {
        uint256 tokenId = totalSupply() + 1; // Automatically assign the next token ID
        _safeMint(to, tokenId);
    }

    /**
     * @dev Emitted when an approval is revoked.
     */
    event ApprovalRevoked(uint256 indexed tokenId, address indexed owner);
}
