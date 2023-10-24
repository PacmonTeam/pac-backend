// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

import './interfaces/IPriceFeed.sol';

contract PacPriceFeed is AggregatorV3Interface {
    int256 public answer;
    uint80 public roundId;

    uint8 public constant override decimals = 8;
    string public constant override description = 'PriceFeed';
    uint256 public constant override version = 1;

    address public gov;

    mapping(uint80 => int256) public answers;
    mapping(address => bool) public isAdmin;

    constructor() {
        gov = msg.sender;
        isAdmin[msg.sender] = true;
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
