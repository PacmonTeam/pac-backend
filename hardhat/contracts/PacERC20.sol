// SPDX-License-Identifier: UNLICENSED

pragma solidity =0.8.19;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

import './interfaces/IPacERC20.sol';

contract PacERC20 is ERC20, IPacERC20 {
    uint8 private immutable __decimals;

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) ERC20(_name, _symbol) {
        __decimals = _decimals;
    }

    function decimals() public view override returns (uint8) {
        return __decimals;
    }

    function mint(address _to, uint256 _amount) external returns (bool) {
        _mint(_to, _amount);
        emit Mint(_to, _amount);
        return true;
    }

    function burn(uint256 _amount) external returns (bool) {
        _burn(msg.sender, _amount);
        emit Burn(msg.sender, _amount);
        return true;
    }
}
