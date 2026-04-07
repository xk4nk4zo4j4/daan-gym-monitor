import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, RefreshCw, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

function App() {
  const [gymData, setGymData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch from static JSON file (updated by GitHub Actions)
  const fetchData = async () => {
    setLoading(true);
    try {
      // In development, you might need a slash, in production it's relative
      const res = await axios.get('./data.json?v=' + new Date().getTime());
      setGymData(res.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch data.json:', err);
      // Fallback for local testing if data.json is missing
      setError('與伺服器連線中...');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper to calculate color and level
  const getStatus = (current, max) => {
    const ratio = current / max;
    if (ratio < 0.4) return { label: '舒適', color: '#4ade80', class: 'status-green' };
    if (ratio < 0.8) return { label: '適中', color: '#facc15', class: 'status-yellow' };
    return { label: '擁擠', color: '#f87171', class: 'status-red' };
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center justify-center">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-4xl font-bold gradient-text m-0 tracking-tight">大安健身房頻道</h1>
        <p className="text-gray-400 mt-2 font-light">Real-time Gym Monitor</p>
      </motion.header>

      <div className="w-full max-w-md">
        {/* Gym Occupancy Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 flex flex-col"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg">
                    <Activity className="text-cyan-400" size={24} />
                </div>
                <h2 className="text-xl font-semibold m-0">當前人數</h2>
            </div>
            <button onClick={fetchData} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
               <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {!loading && gymData?.gym ? (
            <div>
              <div className="flex justify-between items-end mb-3">
                <span className="text-6xl font-bold tracking-tighter tabular-nums">
                    {gymData.gym.current}
                </span>
                <span className="text-gray-500 font-medium mb-2 text-lg">/ {gymData.gym.max} 人</span>
              </div>
              
              <div className="progress-container h-4">
                <motion.div 
                    className="progress-bar" 
                    initial={{ width: 0 }}
                    animate={{ 
                        width: `${Math.min((gymData.gym.current / gymData.gym.max) * 100, 100)}%`,
                        backgroundColor: getStatus(gymData.gym.current, gymData.gym.max).color
                    }}
                />
              </div>

              <div className="flex justify-between items-center mt-6">
                <span className={`status-badge text-sm px-4 py-1 ${getStatus(gymData.gym.current, gymData.gym.max).class}`}>
                    {getStatus(gymData.gym.current, gymData.gym.max).label}
                </span>
                <div className="text-xs text-gray-500 flex flex-col items-end">
                    <span className="flex items-center gap-1"><Clock size={12} /> 最後更新</span>
                    <span>{gymData.timestamp ? new Date(gymData.timestamp).toLocaleString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-gray-500 gap-4">
                {loading ? (
                    <div className="flex flex-col items-center gap-2">
                        <RefreshCw size={32} className="animate-spin text-cyan-500/50" />
                        <span className="text-sm font-light animate-pulse">讀取中...</span>
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="text-red-400 mb-2">{error || '暫時無法獲取數據'}</p>
                        <button onClick={fetchData} className="text-xs underline text-cyan-500">重試</button>
                    </div>
                )}
            </div>
          )}
        </motion.div>

        <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center text-gray-600 text-[10px] uppercase tracking-widest mt-8 font-light"
        >
            自動同步中 • Daan Sports Center
        </motion.p>
      </div>

      <footer className="mt-auto py-8 text-center text-gray-700 text-xs font-light">
          <p>© 2024 Daan Monitor | Powered by Antigravity</p>
      </footer>
    </div>
  );
}

export default App;
