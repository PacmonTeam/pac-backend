// SPDX-License-Identifier: MIT

pragma solidity >=0.5.0;

interface IPacERC20 {
    event Mint(address indexed to, uint value);
    event Burn(address indexed from, uint value);

    function mint(address to, uint256 value) external returns (bool);

    function burn(uint256 value) external returns (bool);
}
