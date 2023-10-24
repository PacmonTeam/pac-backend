// SPDX-License-Identifier: MIT

pragma solidity >=0.5.0;

import './IUniswapV2Pair.sol';

interface IPacUniswapV2Pair is IUniswapV2Pair {
    function admin() external view returns (address);

    function setTokenAmounts(
        uint256 amount0,
        uint256 amount1
    ) external returns (bool);
}
