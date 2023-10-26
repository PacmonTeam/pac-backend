// SPDX-License-Identifier: MIT

pragma solidity =0.8.20;

import './interfaces/IERC20.sol';
import './interfaces/IUniswapV2Pair.sol';
import './interfaces/IPriceFeed.sol';

contract PacDemo {
    uint256 public constant PRICE_PRECISION = 10 ** 30;

    address public gov;

    address public token0;
    address public token1;
    address public pair;
    address public pricefeed0;
    address public pricefeed1;

    bool public depositEnabled;
    bool public withdrawEnabled;

    mapping(address => uint256) public balances0;
    mapping(address => uint256) public balances1;

    modifier onlyGov() {
        require(msg.sender == gov, 'only gov');
        _;
    }

    constructor(
        address _token0,
        address _token1,
        address _pair,
        address _pricefeed0,
        address _pricefeed1
    ) {
        gov = msg.sender;
        token0 = _token0;
        token1 = _token1;
        pair = _pair;
        pricefeed0 = _pricefeed0;
        pricefeed1 = _pricefeed1;
    }

    function getReserves()
        public
        view
        returns (uint256 reserve0, uint256 reserve1)
    {
        (reserve0, reserve1, ) = IUniswapV2Pair(pair).getReserves();
    }

    function getPrice0() public view returns (uint256 price) {
        (, int256 price0, , , ) = AggregatorV3Interface(pricefeed0)
            .latestRoundData();
        uint256 decimals0 = IERC20(token0).decimals();
        price =
            (uint256(price0) * PRICE_PRECISION) /
            (10 ** AggregatorV3Interface(pricefeed0).decimals());
    }

    function getPrice1() public view returns (uint256 price) {
        (, int256 price1, , , ) = AggregatorV3Interface(pricefeed1)
            .latestRoundData();
        price =
            (uint256(price1) * PRICE_PRECISION) /
            (10 ** AggregatorV3Interface(pricefeed1).decimals());
    }

    function getPrices() public view returns (uint256 price0, uint256 price1) {
        price0 = getPrice0();
        price1 = getPrice1();
    }

    function getAMMPrices()
        public
        view
        returns (uint256 ammPrice0, uint256 ammPrice1)
    {
        uint256 decimals0 = IERC20(token0).decimals();
        uint256 decimals1 = IERC20(token1).decimals();
        (uint256 reserve0, uint256 reserve1) = getReserves();
        ammPrice0 =
            (reserve1 * PRICE_PRECISION * (10 ** decimals0)) /
            reserve0 /
            (10 ** decimals1);
        ammPrice1 =
            (reserve0 * PRICE_PRECISION * (10 ** decimals1)) /
            reserve1 /
            (10 ** decimals0);
    }

    function getValue0(address account) public view returns (uint256 value) {
        uint256 balance0 = balances0[account];

        (, int256 price0, , , ) = AggregatorV3Interface(pricefeed0)
            .latestRoundData();

        uint256 decimals0 = IERC20(token0).decimals();

        value =
            (balance0 * uint256(price0) * PRICE_PRECISION) /
            (10 ** (decimals0 + AggregatorV3Interface(pricefeed0).decimals()));
    }

    function getValue1(address account) public view returns (uint256 value) {
        uint256 balance1 = balances1[account];

        (, int256 price1, , , ) = AggregatorV3Interface(pricefeed1)
            .latestRoundData();

        uint256 decimals1 = IERC20(token1).decimals();

        value =
            (balance1 * uint256(price1) * PRICE_PRECISION) /
            (10 ** (decimals1 + AggregatorV3Interface(pricefeed1).decimals()));
    }

    function getValues(
        address account
    ) public view returns (uint256 value0, uint256 value1, uint256 value) {
        value0 = getValue0(account);
        value1 = getValue1(account);
        value = value0 + value1;
    }

    function setDepositEnabled(bool _depositEnabled) public onlyGov {
        depositEnabled = _depositEnabled;
    }

    function setWithdrawEnabled(bool _withdrawEnabled) public onlyGov {
        withdrawEnabled = _withdrawEnabled;
    }

    function deposit(address token, uint256 amount) public {
        require(depositEnabled, 'deposit disabled');
        if (token == token0) {
            balances0[msg.sender] += amount;
        } else if (token == token1) {
            balances1[msg.sender] += amount;
        } else {
            revert('invalid token');
        }
        IERC20(token).transferFrom(msg.sender, address(this), amount);
    }

    function withdraw(address token, uint256 amount) public {
        require(withdrawEnabled, 'withdraw disabled');
        if (token == token0) {
            require(
                balances0[msg.sender] >= amount,
                'insufficient balance of token0'
            );
            balances0[msg.sender] -= amount;
        } else if (token == token1) {
            require(
                balances1[msg.sender] >= amount,
                'insufficient balance of token1'
            );
            balances1[msg.sender] -= amount;
        } else {
            revert('invalid token');
        }
        IERC20(token).transfer(msg.sender, amount);
    }

    function balance() public {
        uint256 balance0 = balances0[msg.sender];
        uint256 balance1 = balances1[msg.sender];

        uint256 value0 = getValue0(msg.sender);
        uint256 value1 = getValue1(msg.sender);

        if (value0 > value1) {
            uint256 amount = ((value0 - value1) * balance0) /
                PRICE_PRECISION /
                2;
            balances0[msg.sender] -= amount;
            _swap(token0, token1, amount);
        } else if (value0 < value1) {
            uint256 amount = ((value1 - value0) * balance1) /
                PRICE_PRECISION /
                2;
            balances1[msg.sender] -= amount;
            _swap(token1, token0, amount);
        }
    }

    function swap(
        address fromToken,
        address toToken,
        uint256 amount
    ) public returns (uint256) {
        require(
            fromToken == token0 || fromToken == token1,
            'invalid fromToken'
        );
        require(toToken == token0 || toToken == token1, 'invalid toToken');
        require(fromToken != toToken, 'fromToken == toToken');
        if (fromToken == token0) {
            require(
                balances0[msg.sender] >= amount,
                'insufficient balance of token0'
            );
            balances0[msg.sender] -= amount;
        } else {
            require(
                balances1[msg.sender] >= amount,
                'insufficient balance of token1'
            );
            balances1[msg.sender] -= amount;
        }
        _swap(fromToken, toToken, amount);
        return IERC20(toToken).balanceOf(address(this));
    }

    function _swap(address fromToken, address toToken, uint256 amount) public {
        address pairToken0 = IUniswapV2Pair(pair).token0();
        (uint256 reserve0, uint256 reserve1, ) = IUniswapV2Pair(pair)
            .getReserves();
        IERC20(fromToken).transfer(pair, amount);
        (uint256 reserveFrom, uint256 reserveTo) = fromToken == pairToken0
            ? (reserve0, reserve1)
            : (reserve1, reserve0);
        uint256 amountOut = _getAmountOut(amount, reserveFrom, reserveTo);
        if (toToken == token0) {
            IUniswapV2Pair(pair).swap(amountOut, 0, address(this), '');
        } else {
            IUniswapV2Pair(pair).swap(0, amountOut, address(this), '');
        }
    }

    // given an input amount of an asset and pair reserves, returns the maximum output amount of the other asset
    function _getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) internal pure returns (uint256 amountOut) {
        require(amountIn > 0, 'UniswapV2Library: INSUFFICIENT_INPUT_AMOUNT');
        require(
            reserveIn > 0 && reserveOut > 0,
            'UniswapV2Library: INSUFFICIENT_LIQUIDITY'
        );
        uint256 amountInWithFee = amountIn * 9970;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * 10000 + amountInWithFee;
        amountOut = numerator / denominator;
    }
}
