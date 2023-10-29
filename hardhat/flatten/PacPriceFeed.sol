// Sources flattened with hardhat v2.18.1 https://hardhat.org

// SPDX-License-Identifier: MIT

// File contracts/interfaces/IPriceFeed.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.0;

interface AggregatorV3Interface {
    function decimals() external view returns (uint8);

    function description() external view returns (string memory);

    function version() external view returns (uint256);

    function getRoundData(
        uint80 _roundId
    )
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}

// File contracts/PacPriceFeed.sol

// Original license: SPDX_License_Identifier: MIT

pragma solidity 0.8.19;

contract PacPriceFeed is AggregatorV3Interface {
    int256 public answer;
    uint80 public roundId;

    uint8 public immutable override decimals;
    string public override description = 'PriceFeed';
    uint256 public constant override version = 1;

    address public gov;

    mapping(uint80 => int256) public answers;
    mapping(address => bool) public isAdmin;

    constructor(string memory _description, uint8 _decimals) {
        gov = msg.sender;
        isAdmin[msg.sender] = true;
        description = _description;
        decimals = _decimals;
    }

    function setAdmin(address _account, bool _isAdmin) public {
        require(msg.sender == gov, 'PacPriceFeed: FORBIDDEN');
        isAdmin[_account] = _isAdmin;
    }

    function setLatestAnswer(int256 _answer) public {
        require(isAdmin[msg.sender], 'PacPriceFeed: FORBIDDEN');
        roundId = roundId + 1;
        answer = _answer;
        answers[roundId] = _answer;
    }

    function latestRoundData()
        public
        view
        override
        returns (uint80, int256, uint256, uint256, uint80)
    {
        return (roundId, answer, 0, 0, 0);
    }

    // returns roundId, answer, startedAt, updatedAt, answeredInRound
    function getRoundData(
        uint80 _roundId
    ) public view override returns (uint80, int256, uint256, uint256, uint80) {
        return (_roundId, answers[_roundId], 0, 0, 0);
    }
}
