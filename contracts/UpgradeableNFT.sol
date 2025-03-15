// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract UpgradeableNFT is ERC721URIStorage, Initializable {
    constructor() ERC721("UpgradeableNFT", "UNFT") {} // 👈 Fix: Pass name and symbol in constructor

    function mint(address to, uint256 tokenId, string memory uri) public {
        _mint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }
}
