// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

contract OracleConfig {
    address public owner;
    uint256 private _minimumStake;
    uint256 private _consensusThreshold;
    uint256 private _updateInterval;
    
    event ConfigUpdated(string parameter, uint256 oldValue, uint256 newValue);
    
    constructor() {
        owner = msg.sender;
        _minimumStake = 0.01 ether; // 0.01 RBTC
        _consensusThreshold = 5;
        _updateInterval = 600; // 10 minutes
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    function setMinimumStake(uint256 _newStake) external onlyOwner {
        emit ConfigUpdated("minimumStake", _minimumStake, _newStake);
        _minimumStake = _newStake;
    }
    
    function setConsensusThreshold(uint256 _newThreshold) external onlyOwner {
        require(_newThreshold >= 3, "Minimum 3 nodes for consensus");
        emit ConfigUpdated("consensusThreshold", _consensusThreshold, _newThreshold);
        _consensusThreshold = _newThreshold;
    }
    
    function setUpdateInterval(uint256 _newInterval) external onlyOwner {
        require(_newInterval >= 60, "Minimum 1 minute interval");
        emit ConfigUpdated("updateInterval", _updateInterval, _newInterval);
        _updateInterval = _newInterval;
    }
    
    // View functions
    function minimumStake() external view returns (uint256) {
        return _minimumStake;
    }
    
    function consensusThreshold() external view returns (uint256) {
        return _consensusThreshold;
    }
    
    function updateInterval() external view returns (uint256) {
        return _updateInterval;
    }
}