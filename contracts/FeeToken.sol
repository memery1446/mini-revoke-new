// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FeeToken is ERC20 {
    uint256 public feePercentage = 2;
    address public feeReceiver;

    constructor(string memory name, string memory symbol, uint8 decimals, address _feeReceiver)
        ERC20(name, symbol)
    {
        feeReceiver = _feeReceiver;
        _mint(msg.sender, 1000000 * 10**decimals);
    }

    function transfer(address recipient, uint256 amount) public override returns (bool) {
        uint256 fee = (amount * feePercentage) / 100;
        uint256 amountAfterFee = amount - fee;
        super.transfer(feeReceiver, fee);
        return super.transfer(recipient, amountAfterFee);
    }

    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        uint256 fee = (amount * feePercentage) / 100;
        uint256 amountAfterFee = amount - fee;
        super.transferFrom(sender, feeReceiver, fee);
        return super.transferFrom(sender, recipient, amountAfterFee);
    }
}
