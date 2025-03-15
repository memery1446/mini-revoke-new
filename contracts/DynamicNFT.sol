// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

// DynamicNFT (ERC-721 with changing metadata)
contract DynamicNFT is ERC721URIStorage {
    mapping(uint256 => string) private tokenURIs;

    constructor() ERC721("DynamicNFT", "DNFT") {}

    function mint(address to, uint256 tokenId, string memory initialURI) public {
        _mint(to, tokenId);
        tokenURIs[tokenId] = initialURI;
        _setTokenURI(tokenId, initialURI);
    }

    function updateTokenURI(uint256 tokenId, string memory newURI) public {
        require(ownerOf(tokenId) == msg.sender, "Not the owner");
        tokenURIs[tokenId] = newURI;
        _setTokenURI(tokenId, newURI);
    }
}

