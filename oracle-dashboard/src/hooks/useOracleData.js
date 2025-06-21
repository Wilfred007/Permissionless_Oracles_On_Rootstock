import { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from './useWeb3';

export const useOracleData = () => {
  const { oracleContract, configContract, connected } = useWeb3();
  const [data, setData] = useState({
    price: { value: 0, timestamp: 0 },
    nodeCount: 0,
    currentRound: 0,
    config: { minStake: 0, threshold: 0, interval: 0 },
    nodes: [],
    loading: true,
    error: null
  });

  const fetchOracleData = useCallback(async () => {
    if (!oracleContract || !configContract || !connected) return;

    try {
      console.log('📊 Fetching oracle data...');
      
      // Fetch basic oracle data
      const [priceData, nodeCount, currentRound] = await Promise.all([
        oracleContract.getPrice(),
        oracleContract.getNodeCount(),
        oracleContract.currentRound()
      ]);

      // Fetch config data
      const [minStake, threshold, interval] = await Promise.all([
        configContract.minimumStake(),
        configContract.consensusThreshold(),
        configContract.updateInterval()
      ]);

      // Fetch node details
      const nodePromises = [];
      const nodeCount_ = Number(nodeCount);
      for (let i = 0; i < Math.min(nodeCount_, 10); i++) { // Limit to 10 nodes for performance
        nodePromises.push(
          oracleContract.nodes(i).then(async (nodeAddress) => {
            const [stake, reputation] = await Promise.all([
              oracleContract.stakes(nodeAddress),
              oracleContract.getNodeReputation(nodeAddress)
            ]);
            return {
              address: nodeAddress,
              stake: stake.toString(),
              reputation: Number(reputation)
            };
          })
        );
      }

      const nodes = await Promise.all(nodePromises);

      setData({
        price: {
          value: Number(priceData[0]),
          timestamp: Number(priceData[1])
        },
        nodeCount: nodeCount_,
        currentRound: Number(currentRound),
        config: {
          minStake: minStake.toString(),
          threshold: Number(threshold),
          interval: Number(interval)
        },
        nodes,
        loading: false,
        error: null
      });

      console.log('✅ Oracle data updated');
    } catch (err) {
      console.error('❌ Failed to fetch oracle data:', err);
      setData(prev => ({ ...prev, loading: false, error: err.message }));
    }
  }, [oracleContract, configContract, connected]);

  useEffect(() => {
    if (connected) {
      fetchOracleData();
      
      // Set up periodic updates
      const interval = setInterval(fetchOracleData, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [connected, fetchOracleData]);

  const refreshData = () => {
    setData(prev => ({ ...prev, loading: true }));
    fetchOracleData();
  };

  return { ...data, refreshData };
};