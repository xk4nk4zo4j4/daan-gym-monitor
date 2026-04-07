import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, RefreshCw, Clock, TrendingUp, BarChart3, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';

function App() {
  const [gymData, setGymData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch from static JSON files (updated by GitHub Actions)
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch current occupancy
      const resData = await axios.get('./data.json?v=' + new Date().getTime());
      setGymData(resData.data);
      
      // Fetch history log
      const resHistory = await axios.get('./history.json?v=' + new Date().getTime());
      setHistory(resHistory.data || []);
      
      setError(null);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('同步數據中...');
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

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 border border-white/20 shadow-2xl scale-105 transition-transform">
          <p className="text-xs text-gray-400 mb-1 font-light">{payload[0].payload.label}</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm" />
            <p className="text-lg font-bold gradient-text m-0">{payload[0].value} 人</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen p-4 md:p-10 flex flex-col items-center">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center w-full max-w-4xl flex justify-between items-center"
      >
        <div className="text-left">
          <h1 className="text-4xl font-bold gradient-text m-0 tracking-tight flex items-center gap-3">
              大安運動中心 <TrendingUp className="text-cyan-400" size={32} />
          </h1>
          <p className="text-gray-500 mt-2 font-light text-sm uppercase tracking-widest">Real-Time Traffic Dashboard</p>
        </div>
        <button 
            onClick={fetchData} 
            className="p-4 glass-card rounded-2xl hover:scale-105 active:scale-95 transition-all"
        >
           <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
        </button>
      </motion.header>

      <div className="w-full max-w-5xl space-y-8">
        {/* Main Stats and Chart Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Real-time Card */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-8 flex flex-col justify-between"
          >
            <div className="flex items-center gap-3 mb-10">
                <div className="p-3 bg-cyan-500/10 rounded-xl">
                    <Activity className="text-cyan-400" size={24} />
                </div>
                <h2 className="text-lg font-semibold tracking-wide m-0">當前健身房</h2>
            </div>

            {!loading && gymData?.gym ? (
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-7xl font-bold tracking-tighter tabular-nums leading-none">
                        {gymData.gym.current}
                    </span>
                    <span className="text-gray-500 font-medium text-xl mb-1 ml-2">/ {gymData.gym.max} 人</span>
                  </div>
                  
                  <div className="progress-container h-3 shadow-inner">
                    <motion.div 
                        className="progress-bar shadow-sm" 
                        initial={{ width: 0 }}
                        animate={{ 
                            width: `${Math.min((gymData.gym.current / gymData.gym.max) * 100, 100)}%`,
                            backgroundColor: getStatus(gymData.gym.current, gymData.gym.max).color
                        }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                    <span className={`status-badge text-xs px-5 py-2 ${getStatus(gymData.gym.current, gymData.gym.max).class}`}>
                        {getStatus(gymData.gym.current, gymData.gym.max).label}
                    </span>
                    <div className="text-[10px] text-gray-500 flex flex-col items-end">
                        <span className="flex items-center gap-1 font-semibold uppercase tracking-tighter"><Clock size={12} /> Last Sync</span>
                        <span className="mt-1">{gymData.timestamp ? new Date(gymData.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '--:--:--'}</span>
                    </div>
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-gray-600 gap-4">
                  <RefreshCw size={48} className="animate-spin opacity-20" />
                  <p className="animate-pulse font-light uppercase tracking-widest text-xs">Synchronizing...</p>
              </div>
            )}
          </motion.div>

          {/* Right: Trend Chart Card */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-8 lg:col-span-2 flex flex-col min-h-[400px]"
          >
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-500/10 rounded-xl">
                        <BarChart3 className="text-indigo-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold tracking-wide m-0">人潮波動統計</h2>
                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">7-Day Usage Intensity</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[250px] relative">
                {history.length > 2 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4facfe" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#00f2fe" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                            <XAxis 
                                dataKey="label" 
                                hide={history.length > 50} 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fill: '#666' }} 
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(79, 172, 254, 0.4)', strokeWidth: 1 }} />
                            <Area 
                                type="monotone" 
                                dataKey="current" 
                                stroke="#4facfe" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorCurrent)" 
                                animationDuration={1500}
                            />
                            <ReferenceLine y={40} label={{ position: 'right', value: '平衡點', fill: '#444', fontSize: 10 }} stroke="#ffffff08" strokeDasharray="3 3" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 gap-4">
                        <div className="p-6 bg-white/5 rounded-full relative overflow-hidden">
                            <motion.div 
                                className="absolute inset-0 bg-cyan-500/10"
                                animate={{ x: ['100%', '-100%'] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            />
                            <BarChart3 size={48} className="opacity-10" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-light">正在累積首日數據統計...</p>
                            <p className="text-[10px] text-gray-600 mt-2 flex items-center gap-1 justify-center">
                                <AlertCircle size={10} /> 預計後天可產出完整週趨勢圖表
                            </p>
                        </div>
                    </div>
                )}
            </div>
          </motion.div>
        </div>

        {/* Info Banner */}
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col md:flex-row items-center gap-6 p-6 glass-card bg-cyan-500/5 border-cyan-500/10"
        >
            <div className="p-4 bg-cyan-500/10 rounded-2xl flex-shrink-0">
                <BarChart3 className="text-cyan-400" size={32} />
            </div>
            <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-bold m-0 gradient-text">智慧人潮分析系統</h3>
                <p className="text-sm text-gray-400 mt-2 font-light leading-relaxed">
                    本系統每 30 分鐘自動對大安運動中心進行數據採樣，並透過 GitHub 行動工作流記錄歷史庫存。
                    圖表可幫助您避開尖峰時段（一般為 18:00 - 21:00），優化您的運動體驗。
                </p>
            </div>
        </motion.div>
      </div>

      <footer className="mt-20 mb-10 py-10 text-center border-t border-white/5 w-full max-w-4xl">
          <p className="text-gray-700 text-xs font-light tracking-[0.3em] uppercase">
             © 2024 Daan Monitor System | Powered by Antigravity AI
          </p>
      </footer>
    </div>
  );
}

export default App;
