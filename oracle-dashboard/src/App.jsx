// import { useState, useEffect } from 'react';
// import { RefreshCw, Wifi, WifiOff, ExternalLink } from 'lucide-react';
// import { PriceCard } from './components/PriceCard';
// import { PriceChart } from './components/PriceStats';
// import { NetworkStats } from './components/NetworkStats';
// import { NodeList } from './components/NodeList';
// // import { PriceCard } from './components/PriceCard';
// // import { NetworkStats } from './components/NetworkStats';
// // import { NodeList } from './components/NodeList';
// // import { PriceChart } from './components/PriceChart';
// import { useOracleData } from './hooks/useOracleData';

// function App() {
//   const { price, nodeCount, currentRound, config, nodes, loading, error, refreshData } = useOracleData();
//   const [isOnline, setIsOnline] = useState(navigator.onLine);

//   useEffect(() => {
//     const handleOnline = () => setIsOnline(true);
//     const handleOffline = () => setIsOnline(false);

//     window.addEventListener('online', handleOnline);
//     window.addEventListener('offline', handleOffline);

//     return () => {
//       window.removeEventListener('online', handleOnline);
//       window.removeEventListener('offline', handleOffline);
//     };
//   }, []);

//   const network = import.meta.env.VITE_NETWORK;
//   const explorerUrl = network === 'mainnet' 
//     ? 'https://explorer.rsk.co' 
//     : 'https://explorer.testnet.rsk.co';

//   return (
//     <div className="min-h-screen bg-black">
//       {/* Header */}
//       <header className="bg-gradient-to-r from-rsk-dark to-rsk-gray shadow-lg">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <h1 className="text-3xl font-bold text-white">RSK Oracle Dashboard</h1>
//               <p className="text-gray-300 mt-1">
//                 Real-time Bitcoin price oracle on Rootstock {network}
//               </p>
//             </div>
            
//             <div className="flex items-center space-x-4">
//               <div>
//                 <h1 className='text-red-400'>Hello</h1>
//               </div>
//               <div className="flex items-center space-x-2">
//                 {isOnline ? (
//                   <Wifi className="h-5 w-5 text-green-400" />
//                 ) : (
//                   <WifiOff className="h-5 w-5 text-red-400" />
//                 )}
//                 <span className="text-sm text-gray-300">
//                   {isOnline ? 'Online' : 'Offline'}
//                 </span>
//               </div>
              
//               <button
//                 onClick={refreshData}
//                 disabled={loading}
//                 className="flex items-center space-x-2 px-4 py-2 bg-rsk-orange hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
//               >
//                 <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
//                 <span>Refresh</span>
//               </button>
              
//               <a
//                 href={`${explorerUrl}/address/${import.meta.env.VITE_ORACLE_CONTRACT_ADDRESS}`}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
//               >
//                 <ExternalLink className="h-4 w-4" />
//                 <span>Explorer</span>
//               </a>
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Error Banner */}
//       {error && (
//         <div className="bg-red-600 text-white px-4 py-2 text-center">
//           <p>⚠️ {error}</p>
//         </div>
//       )}

//       {/* Main Content */}
//       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* Left Column */}
//           <div className="lg:col-span-2 space-y-8">
//             {/* Price Card */}
//             <PriceCard price={price} loading={loading} />
            
//             {/* Price Chart */}
//             <PriceChart currentPrice={price} />
            
//             {/* Network Stats */}
//             <NetworkStats 
//               nodeCount={nodeCount}
//               currentRound={currentRound}
//               config={config}
//               loading={loading}
//             />
//           </div>
          
//           {/* Right Column */}
//           <div className="space-y-8">
//             {/* Node List */}
//             <NodeList nodes={nodes} loading={loading} />
            
//             {/* Quick Stats */}
//             <div className="bg-gradient-to-br from-rsk-gray to-gray-800 rounded-xl p-6 card-glow">
//               <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
//               <div className="space-y-3">
//                 <div className="flex justify-between">
//                   <span className="text-gray-400">Network</span>
//                   <span className="text-white capitalize">{network}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-400">Last Update</span>
//                   <span className="text-white">
//                     {price.timestamp > 0 ? new Date(price.timestamp * 1000).toLocaleTimeString() : '---'}
//                   </span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-400">Status</span>
//                   <span className={`${loading ? 'text-yellow-400' : 'text-green-400'}`}>
//                     {loading ? 'Updating...' : 'Active'}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </main>

//       {/* Footer */}
//       <footer className="bg-rsk-dark mt-16 py-8">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="text-center text-gray-400">
//             <p>Powered by Rootstock (RSK) • Bitcoin-Secured Smart Contracts</p>
//             <div className="mt-2 space-x-4">
//               <a href="https://rootstock.io" target="_blank" rel="noopener noreferrer" className="hover:text-rsk-orange">
//                 Learn about RSK
//               </a>
//               <span>•</span>
//               <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-rsk-orange">
//                 View Source
//               </a>
//             </div>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }

// export default App;

import { useState, useEffect } from 'react';
import { RefreshCw, Wifi, WifiOff, ExternalLink } from 'lucide-react';
import { PriceCard } from './components/PriceCard';
import { NetworkStats } from './components/NetworkStats';
import { NodeList } from './components/NodeList';
import { useOracleData } from './hooks/useOracleData';
// import { useOracleData } from './hooks/useOracleData';

// Import components (check if these cause errors)
// import { PriceCard } from './components/PriceCard';
// import { NetworkStats } from './components/NetworkStats';
// import { NodeList } from './components/NodeList';
// import { PriceChart } from './components/PriceChart';

function App() {
  const oracleData = useOracleData();
  
  // Debug logging
  console.log('🐛 App render - Oracle data:', oracleData);
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Destructure data for easier access
  const { 
    price, 
    nodeCount, 
    currentRound, 
    config, 
    nodes, 
    loading, 
    error, 
    demoMode,
    refreshData 
  } = oracleData;

  const network = import.meta.env.VITE_NETWORK || 'testnet';
  const explorerUrl = network === 'mainnet' 
    ? 'https://explorer.rsk.co' 
    : 'https://explorer.testnet.rsk.co';

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">RSK Oracle Dashboard</h1>
              <p className="text-gray-300 mt-1">
                Real-time Bitcoin price oracle on Rootstock {network}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {isOnline ? (
                  <Wifi className="h-5 w-5 text-green-400" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-400" />
                )}
                <span className="text-sm text-gray-300">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              
              <button
                onClick={refreshData}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-600 text-white px-4 py-2 text-center">
          <p>⚠️ {error}</p>
        </div>
      )}

      {/* Demo Mode Banner */}
      {demoMode && (
        <div className="bg-yellow-600 text-white px-4 py-2 text-center">
          <p>📊 Demo Mode: Showing sample data. Check contract addresses and network connection.</p>
        </div>
      )}

      {/* Debug Info */}
      <div className="bg-blue-600 text-white px-4 py-2 text-center">
        <p>🐛 Debug: Loading: {loading ? 'Yes' : 'No'} | Price: ${(price?.value || 0)/100} | Nodes: {nodeCount} | Demo: {demoMode ? 'Yes' : 'No'}</p>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Simple Test Content First */}
        {/* <h1 className='text-red-400'>Hello</h1> */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Raw Data Test</h2>
          <div className="text-white space-y-2">
            <p>Price Value: {price?.value || 'Not loaded'}</p>
            <p>Price Timestamp: {price?.timestamp || 'Not loaded'}</p>
            <p>Node Count: {nodeCount || 'Not loaded'}</p>
            <p>Current Round: {currentRound || 'Not loaded'}</p>
            <p>Loading: {loading ? 'Yes' : 'No'}</p>
            <p>Error: {error || 'None'}</p>
            <p>Demo Mode: {demoMode ? 'Yes' : 'No'}</p>
            <p>Config Min Stake: {config?.minStake || 'Not loaded'}</p>
            <p>Nodes Array Length: {nodes?.length || 0}</p>
          </div>
        </div>

        {/* Try Simple Components */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Simple Price Card Test */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Simple Price Test</h3>
            <div className="text-white">
              <div className="text-3xl font-bold text-orange-500">
                ${((price?.value || 0) / 100).toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">
                {price?.timestamp ? new Date(price.timestamp * 1000).toLocaleString() : 'No timestamp'}
              </div>
            </div>
          </div>

          {/* Simple Stats Test */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Simple Stats Test</h3>
            <div className="text-white space-y-2">
              <p>👥 Active Nodes: {nodeCount || 0}</p>
              <p>🔄 Current Round: {currentRound || 0}</p>
              <p>⚙️ Update Interval: {config?.interval || 0}s</p>
              <p>🎯 Consensus Threshold: {config?.threshold || 0}</p>
            </div>
          </div>
        </div>

        {/* Try Loading Actual Components (comment out if they cause errors) */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-white mb-4">Component Tests</h3>
          
          {/* Test each component individually */}
          <div className="space-y-8">
            <div>
              <h4 className="text-white mb-2">PriceCard Component:</h4>
              <PriceCard price={price || { value: 0, timestamp: 0 }} loading={loading} />
            </div>
            
            <div>
              <h4 className="text-white mb-2">NetworkStats Component:</h4>
              <NetworkStats 
                nodeCount={nodeCount || 0}
                currentRound={currentRound || 0}
                config={config || { minStake: 0, threshold: 0, interval: 0 }}
                loading={loading}
              />
            </div>
            
            <div>
              <h4 className="text-white mb-2">NodeList Component:</h4>
              <NodeList nodes={nodes || []} loading={loading} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;