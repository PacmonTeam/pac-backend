// SPDX-License-Identifier: UNLICENSED

pragma solidity =0.8.20;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract PacERC20 is ERC20 {
    uint8 private immutable __decimals;
    address public admin;

    modifier onlyAdmin() {
        require(msg.sender == admin, 'PacERC20: only admin');
        _;
    }

    constructor(
        address _to,
        uint256 _totalSupply,
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) ERC20(_name, _symbol) {
        _mint(_to, _totalSupply);
        admin = msg.sender;
        __decimals = _decimals;
    }

    function decimals() public view override returns (uint8) {
        return __decimals;
    }

    function setAdmin(address _admin) external onlyAdmin {
        admin = _admin;
    }

    function mint(address _to, uint256 _amount) external onlyAdmin {
        _mint(_to, _amount);
    }
}
