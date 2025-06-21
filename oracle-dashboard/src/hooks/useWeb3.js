import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';

// Contract ABIs (simplified)
const ORACLE_ABI = [
  "function getPrice() external view returns (uint256, uint256)",
  "function getNodeCount() external view returns (uint256)",
  "function currentRound() external view returns (uint256)",
  "function stakes(address) external view returns (uint256)",
  "function getNodeReputation(address) external view returns (uint256)",
  "function nodes(uint256) external view returns (address)",
  "function getRoundSubmissions(uint256) external view returns (tuple(address node, uint256 price, uint256 timestamp, bool slashed)[])",
  "function config() external view returns (address)"
];

const CONFIG_ABI = [
  "function minimumStake() external view returns (uint256)",
  "function consensusThreshold() external view returns (uint256)",
  "function updateInterval() external view returns (uint256)"
];

export const useWeb3 = () => {
  const [provider, setProvider] = useState(null);
  const [oracleContract, setOracleContract] = useState(null);
  const [configContract, setConfigContract] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef();

  useEffect(() => {
    initializeWeb3();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const initializeWeb3 = async () => {
    try {
      const rpcUrl = import.meta.env.VITE_NETWORK === 'mainnet' 
        ? import.meta.env.VITE_RSK_MAINNET_RPC 
        : import.meta.env.VITE_RSK_TESTNET_RPC;
      
      const ethersProvider = new ethers.JsonRpcProvider(rpcUrl);
      setProvider(ethersProvider);

      // Initialize contracts
      const oracleAddress = import.meta.env.VITE_ORACLE_CONTRACT_ADDRESS;
      const configAddress = import.meta.env.VITE_CONFIG_CONTRACT_ADDRESS;

      if (oracleAddress && configAddress) {
        const oracle = new ethers.Contract(oracleAddress, ORACLE_ABI, ethersProvider);
        const config = new ethers.Contract(configAddress, CONFIG_ABI, ethersProvider);
        
        setOracleContract(oracle);
        setConfigContract(config);
        setConnected(true);
        
        console.log('🔗 Connected to RSK Oracle contracts');
      } else {
        setError('Contract addresses not configured');
      }
    } catch (err) {
      console.error('Web3 initialization failed:', err);
      setError(err.message);
    }
  };

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const signer = await browserProvider.getSigner();
        
        // Update contracts with signer for write operations
        if (oracleContract && configContract) {
          const oracleWithSigner = oracleContract.connect(signer);
          const configWithSigner = configContract.connect(signer);
          
          setOracleContract(oracleWithSigner);
          setConfigContract(configWithSigner);
        }
        
        return signer;
      } else {
        throw new Error('No Web3 wallet found');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    provider,
    oracleContract,
    configContract,
    connected,
    error,
    connectWallet
  };
};