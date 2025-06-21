// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "./OracleConfig.sol";

contract PriceOracle {
    OracleConfig public config;
    
    uint256 public latestPrice;
    uint256 public lastUpdateTime;
    address[] public nodes;
    
    mapping(address => uint256) public stakes;
    mapping(address => uint256) public cooldownStart;
    mapping(address => uint256) public reputation; // 0-100 score
    mapping(uint256 => Submission[]) public submissions;
    mapping(uint256 => bool) public roundFinalized;
    
    uint256 public currentRound;
    uint256 public constant COOLDOWN_PERIOD = 1 days;
    uint256 public constant SLASHING_THRESHOLD = 10; // 10% deviation
    
    struct Submission {
        address node;
        uint256 price;
        uint256 timestamp;
        bool slashed;
    }

    event PriceUpdated(uint256 indexed round, uint256 price, uint256 timestamp);
    event StakeWithdrawn(address indexed node, uint256 amount);
    event NodeSlashed(address indexed node, uint256 amount, uint256 round);
    event NodeJoined(address indexed node, uint256 stake);

    constructor(address _configAddress) {
        config = OracleConfig(_configAddress);
        currentRound = 1;
    }

    modifier onlyStakedNode() {
        require(stakes[msg.sender] >= config.minimumStake(), "Insufficient stake");
        _;
    }

    function stake() external payable {
        require(msg.value >= config.minimumStake(), "Below minimum stake");
        
        if (stakes[msg.sender] == 0) {
            nodes.push(msg.sender);
            reputation[msg.sender] = 100; // Start with perfect reputation
            emit NodeJoined(msg.sender, msg.value);
        }
        
        stakes[msg.sender] += msg.value;
        cooldownStart[msg.sender] = 0; // Reset cooldown if re-staking
    }

    function initiateWithdraw() external {
        require(stakes[msg.sender] > 0, "No stake to withdraw");
        cooldownStart[msg.sender] = block.timestamp;
    }

    function withdraw() external {
        require(stakes[msg.sender] > 0, "No stake");
        require(cooldownStart[msg.sender] != 0, "Withdraw not initiated");
        require(
            block.timestamp >= cooldownStart[msg.sender] + COOLDOWN_PERIOD, 
            "Cooldown not passed"
        );

        uint256 amount = stakes[msg.sender];
        stakes[msg.sender] = 0;
        cooldownStart[msg.sender] = 0;
        
        // Remove from nodes array
        _removeNode(msg.sender);
        
        payable(msg.sender).transfer(amount);
        emit StakeWithdrawn(msg.sender, amount);
    }

    function submitPrice(uint256 _price) external onlyStakedNode {
        require(!roundFinalized[currentRound], "Round already finalized");
        require(_price > 0, "Invalid price");
        
        // Check if node already submitted for this round
        Submission[] memory roundSubmissions = submissions[currentRound];
        for (uint i = 0; i < roundSubmissions.length; i++) {
            require(roundSubmissions[i].node != msg.sender, "Already submitted");
        }

        submissions[currentRound].push(Submission({
            node: msg.sender,
            price: _price,
            timestamp: block.timestamp,
            slashed: false
        }));

        if (submissions[currentRound].length >= config.consensusThreshold()) {
            _finalizeRound();
        }
    }

    function _finalizeRound() internal {
        require(!roundFinalized[currentRound], "Round already finalized");
        
        Submission[] storage roundSubmissions = submissions[currentRound];
        uint256[] memory prices = new uint256[](roundSubmissions.length);
        
        for (uint i = 0; i < roundSubmissions.length; i++) {
            prices[i] = roundSubmissions[i].price;
        }
        
        uint256 median = _calculateMedian(prices);
        latestPrice = median;
        lastUpdateTime = block.timestamp;
        roundFinalized[currentRound] = true;
        
        // Process slashing
        _processSlashing(median);
        
        emit PriceUpdated(currentRound, median, block.timestamp);
        currentRound++;
    }

    function _processSlashing(uint256 median) internal {
        Submission[] storage roundSubmissions = submissions[currentRound];
        
        for (uint i = 0; i < roundSubmissions.length; i++) {
            uint256 deviation = _calculateDeviation(roundSubmissions[i].price, median);
            
            if (deviation > SLASHING_THRESHOLD) {
                _slashNode(roundSubmissions[i].node, i);
            } else {
                // Reward good behavior by improving reputation
                if (reputation[roundSubmissions[i].node] < 100) {
                    reputation[roundSubmissions[i].node] += 1;
                }
            }
        }
    }

    function _slashNode(address node, uint256 submissionIndex) internal {
        uint256 slashAmount = stakes[node] / 20; // 5% slash
        
        if (slashAmount > 0) {
            stakes[node] -= slashAmount;
            reputation[node] = reputation[node] > 10 ? reputation[node] - 10 : 0;
            submissions[currentRound][submissionIndex].slashed = true;
            
            // If stake falls below minimum, remove node
            if (stakes[node] < config.minimumStake()) {
                _removeNode(node);
            }
            
            emit NodeSlashed(node, slashAmount, currentRound);
        }
    }

    function _calculateDeviation(uint256 price, uint256 median) internal pure returns (uint256) {
        if (price > median) {
            return ((price - median) * 100) / median;
        } else {
            return ((median - price) * 100) / median;
        }
    }

    function _calculateMedian(uint256[] memory arr) internal pure returns (uint256) {
        // Bubble sort for simplicity (consider more efficient sorting for production)
        for (uint i = 0; i < arr.length; i++) {
            for (uint j = i + 1; j < arr.length; j++) {
                if (arr[j] < arr[i]) {
                    (arr[i], arr[j]) = (arr[j], arr[i]);
                }
            }
        }
        return arr[arr.length / 2];
    }

    function _removeNode(address node) internal {
        for (uint i = 0; i < nodes.length; i++) {
            if (nodes[i] == node) {
                nodes[i] = nodes[nodes.length - 1];
                nodes.pop();
                break;
            }
        }
    }

    // View functions
    function getPrice() external view returns (uint256, uint256) {
        return (latestPrice, lastUpdateTime);
    }

    function getNodeCount() external view returns (uint256) {
        return nodes.length;
    }

    function getRoundSubmissions(uint256 round) external view returns (Submission[] memory) {
        return submissions[round];
    }

    function getNodeReputation(address node) external view returns (uint256) {
        return reputation[node];
    }
}