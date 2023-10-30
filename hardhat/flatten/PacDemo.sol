// Sources flattened with hardhat v2.18.1 https://hardhat.org

// SPDX-License-Identifier: MIT

// File contracts/interfaces/IUniswapV2ERC20.sol

// Original license: SPDX_License_Identifier: MIT

pragma solidity >=0.5.0;

interface IUniswapV2ERC20 {
    event Approval(address indexed owner, address indexed spender, uint value);
    event Transfer(address indexed from, address indexed to, uint value);

    function name() external pure returns (string memory);

    function symbol() external pure returns (string memory);

    function decimals() external pure returns (uint8);

    function totalSupply() external view returns (uint);

    function balanceOf(address owner) external view returns (uint);

    function allowance(
        address owner,
        address spender
    ) external view returns (uint);

    function approve(address spender, uint value) external returns (bool);

    function transfer(address to, uint value) external returns (bool);

    function transferFrom(
        address from,
        address to,
        uint value
    ) external returns (bool);

    function DOMAIN_SEPARATOR() external view returns (bytes32);

    function PERMIT_TYPEHASH() external pure returns (bytes32);

    function nonces(address owner) external view returns (uint);

    function permit(
        address owner,
        address spender,
        uint value,
        uint deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}


// File contracts/interfaces/IUniswapV2Pair.sol

// Original license: SPDX_License_Identifier: MIT

pragma solidity >=0.5.0;

interface IUniswapV2Pair is IUniswapV2ERC20 {
    event Mint(address indexed sender, uint amount0, uint amount1);
    event Burn(
        address indexed sender,
        uint amount0,
        uint amount1,
        address indexed to
    );
    event Swap(
        address indexed sender,
        uint amount0In,
        uint amount1In,
        uint amount0Out,
        uint amount1Out,
        address indexed to
    );
    event Sync(uint112 reserve0, uint112 reserve1);

    function MINIMUM_LIQUIDITY() external pure returns (uint);

    function token0() external view returns (address);

    function token1() external view returns (address);

    function getReserves()
        external
        view
        returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);

    function price0CumulativeLast() external view returns (uint);

    function price1CumulativeLast() external view returns (uint);

    function kLast() external view returns (uint);

    function mint(address to) external returns (uint liquidity);

    function burn(address to) external returns (uint amount0, uint amount1);

    function swap(
        uint amount0Out,
        uint amount1Out,
        address to,
        bytes calldata data
    ) external;

    function skim(address to) external;

    function sync() external;

    function initialize(address, address) external;
}


// File contracts/interfaces/IERC20.sol

// Original license: SPDX_License_Identifier: MIT

pragma solidity >=0.5.0;

interface IERC20 {
    event Approval(address indexed owner, address indexed spender, uint value);
    event Transfer(address indexed from, address indexed to, uint value);

    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function decimals() external view returns (uint8);

    function totalSupply() external view returns (uint);

    function balanceOf(address owner) external view returns (uint);

    function allowance(
        address owner,
        address spender
    ) external view returns (uint);

    function approve(address spender, uint value) external returns (bool);

    function transfer(address to, uint value) external returns (bool);

    function transferFrom(
        address from,
        address to,
        uint value
    ) external returns (bool);
}


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


// File contracts/PacDemo.sol

// Original license: SPDX_License_Identifier: MIT

pragma solidity =0.8.19;



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
            uint256 valueDiff = value0 - value1;
            uint256 amount = ((valueDiff * balance0) / value0 / 2);
            balances0[msg.sender] -= amount;
            uint256 amountOut = _swap(token0, token1, amount);
            balances1[msg.sender] += amountOut;
        } else if (value0 < value1) {
            uint256 valueDiff = value1 - value0;
            uint256 amount = ((valueDiff * balance1) / value1 / 2);
            balances1[msg.sender] -= amount;
            uint256 amountOut = _swap(token1, token0, amount);
            balances0[msg.sender] += amountOut;
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

    function _swap(
        address fromToken,
        address toToken,
        uint256 amount
    ) internal returns (uint256 amountOut) {
        address pairToken0 = IUniswapV2Pair(pair).token0();
        (uint256 reserve0, uint256 reserve1, ) = IUniswapV2Pair(pair)
            .getReserves();
        IERC20(fromToken).transfer(pair, amount);
        (uint256 reserveFrom, uint256 reserveTo) = fromToken == pairToken0
            ? (reserve0, reserve1)
            : (reserve1, reserve0);
        amountOut = _getAmountOut(amount, reserveFrom, reserveTo);
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
