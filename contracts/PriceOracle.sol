// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

contract PriceOracle {
    uint256 public latestPrice;
    address[] public nodes;
    mapping(address => uint256) public stakes;
    mapping(address => uint256) public cooldownStart;
    mapping(uint256 => uint256[]) public submissions;
    uint256 public round;
    uint256 public constant COOLDOWN_PERIOD = 1 days;

    event PriceUpdated(uint256 price);
    event StakeWithdrawn(address node, uint256 amount);

    function stake() external payable {
        require(msg.value >= 0.01 ether, "Minimum 0.01 RBTC required");
        if (stakes[msg.sender] == 0) {
            nodes.push(msg.sender);
        }
        stakes[msg.sender] += msg.value;
        cooldownStart[msg.sender] = 0; // reset cooldown if re-staking
    }

    function initiateWithdraw() external {
        require(stakes[msg.sender] > 0, "No stake to withdraw");
        cooldownStart[msg.sender] = block.timestamp;
    }

    function withdraw() external {
        require(stakes[msg.sender] > 0, "No stake");
        require(cooldownStart[msg.sender] != 0, "Withdraw not initiated");
        require(block.timestamp >= cooldownStart[msg.sender] + COOLDOWN_PERIOD, "Cooldown not passed");

        uint256 amount = stakes[msg.sender];
        stakes[msg.sender] = 0;
        cooldownStart[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
        emit StakeWithdrawn(msg.sender, amount);
    }

    function submitPrice(uint256 _price) external {
        require(stakes[msg.sender] > 0, "Not a staked node");
        submissions[round].push(_price);

        if (submissions[round].length >= 5) {
            uint256[] memory data = submissions[round];
            uint256 median = calculateMedian(data);
            latestPrice = median;
            emit PriceUpdated(median);
            round++;
        }
    }

    function calculateMedian(uint256[] memory arr) internal pure returns (uint256) {
        for (uint i = 0; i < arr.length; i++) {
            for (uint j = i + 1; j < arr.length; j++) {
                if (arr[j] < arr[i]) {
                    (arr[i], arr[j]) = (arr[j], arr[i]);
                }
            }
        }
        return arr[arr.length / 2];
    }

    function getPrice() external view returns (uint256) {
        return latestPrice;
    }
}
