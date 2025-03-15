// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract UpgradeableERC1155 is ERC1155URIStorage, Initializable {
    constructor() ERC1155("") {} // 👈 Fix: Provide default URI

    function initialize(string memory uri) public initializer {
        _setURI(uri);
    }

    function mint(address to, uint256 id, uint256 amount) public {
        _mint(to, id, amount, "");
    }
}
