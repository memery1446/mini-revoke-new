// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
}

interface IERC721 {
    function setApprovalForAll(address operator, bool approved) external;
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

interface IERC1155 {
    function setApprovalForAll(address operator, bool approved) external;
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

contract MockSpender {
    address public owner;

    event ERC20Approved(address indexed token, address indexed owner, uint256 amount);
    event ERC721Approved(address indexed nft, address indexed owner, bool approved);
    event ERC1155Approved(address indexed nft, address indexed owner, bool approved);

    constructor() {
        owner = msg.sender;
    }

    // Function to approve ERC-20 token spending
    function approveERC20(address token, address spender, uint256 amount) external {
        require(token != address(0) && spender != address(0), "Invalid address");
        IERC20(token).approve(spender, amount);
        emit ERC20Approved(token, msg.sender, amount);
    }

    // Function to check ERC-20 allowance
    function checkERC20Allowance(address token, address spender) external view returns (uint256) {
        return IERC20(token).allowance(msg.sender, spender);
    }

    // Function to set ERC-721 approval
    function approveERC721(address nft, address operator, bool approved) external {
        require(nft != address(0) && operator != address(0), "Invalid address");
        IERC721(nft).setApprovalForAll(operator, approved);
        emit ERC721Approved(nft, msg.sender, approved);
    }

    // Function to check if ERC-721 is approved
    function checkERC721Approval(address nft, address operator) external view returns (bool) {
        return IERC721(nft).isApprovedForAll(msg.sender, operator);
    }

    // Function to set ERC-1155 approval
    function approveERC1155(address nft, address operator, bool approved) external {
        require(nft != address(0) && operator != address(0), "Invalid address");
        IERC1155(nft).setApprovalForAll(operator, approved);
        emit ERC1155Approved(nft, msg.sender, approved);
    }

    // Function to check if ERC-1155 is approved
    function checkERC1155Approval(address nft, address operator) external view returns (bool) {
        return IERC1155(nft).isApprovedForAll(msg.sender, operator);
    }
}

