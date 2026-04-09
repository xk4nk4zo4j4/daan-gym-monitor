import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const OPEN_HOUR  = 6;
const CLOSE_HOUR = 22;

function isGymOpen() {
  const h = new Date().getHours();
  return h >= OPEN_HOUR && h < CLOSE_HOUR;
}

function nextOpenTime() {
  const now  = new Date();
  const open = new Date(now);
  if (now.getHours() >= CLOSE_HOUR) open.setDate(open.getDate() + 1);
  open.setHours(OPEN_HOUR, 0, 0, 0);
  return open;
}

function formatCountdown(ms) {
  const s   = Math.floor(ms / 1000);
  const h   = Math.floor(s / 3600);
  const m   = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

function getLevel(current, max) {
  const pct = current / max;
  if (pct < 0.4)  return { label:'舒適', color:'#22c55e' };
  if (pct < 0.75) return { label:'適中', color:'#f59e0b' };
  return               { label:'擁擠', color:'#ef4444' };
}

/* ── Ring ─────────────────────────────────────────────────────────────────── */
function OccupancyRing({ current, max, size = 170 }) {
  const r     = size / 2 - 18;
  const circ  = 2 * Math.PI * r;
  const dash  = Math.min(current / max, 1) * circ;
  const level = getLevel(current, max);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display:'block', margin:'0 auto' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={10}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={level.color} strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ * 0.25}
        style={{ transition:'stroke-dasharray 1s cubic-bezier(.4,0,.2,1), stroke 0.5s' }}
      />
      <text x={size/2} y={size/2 - 10} textAnchor="middle" dominantBaseline="middle"
        fill="white" fontFamily="'DM Mono',monospace" fontSize={size * 0.22} fontWeight="500">
        {current}
      </text>
      <text x={size/2} y={size/2 + 22} textAnchor="middle"
        fill="rgba(255,255,255,0.4)" fontFamily="'DM Sans',sans-serif" fontSize={12}>
        / {max} 人
      </text>
      <rect x={size/2 - 24} y={size/2 + 40} width={48} height={20} rx={10} fill={level.color + '28'}/>
      <text x={size/2} y={size/2 + 50} textAnchor="middle" dominantBaseline="middle"
        fill={level.color} fontFamily="'DM Sans',sans-serif" fontSize={11} fontWeight="500">
        {level.label}
      </text>
    </svg>
  );
}

/* ── Dot ──────────────────────────────────────────────────────────────────── */
function PulsingDot({ color }) {
  return (
    <span style={{ position:'relative', display:'inline-flex', width:10, height:10 }}>
      <span style={{ position:'absolute', inset:0, borderRadius:'50%', background:color, opacity:0.4, animation:'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }}/>
      <span style={{ position:'relative', display:'inline-flex', width:10, height:10, borderRadius:'50%', background:color }}/>
    </span>
  );
}

/* ── Tooltip ─────────────────────────────────────────────────────────────── */
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'rgba(15,15,20,0.95)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, padding:'8px 14px', fontSize:13 }}>
      <div style={{ color:'rgba(255,255,255,0.45)', marginBottom:4, fontSize:11 }}>{payload[0].payload.label}</div>
      <div style={{ color:'white', fontFamily:"'DM Mono',monospace", fontWeight:500 }}>{payload[0].value} 人</div>
    </div>
  );
}

/* ── Globe icon ───────────────────────────────────────────────────────────── */
function GlobeIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

/* ── Closed screen ────────────────────────────────────────────────────────── */
function ClosedScreen() {
  const [cd, setCd] = useState('');
  useEffect(() => {
    const tick = () => setCd(formatCountdown(nextOpenTime() - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:24 }}>
      <div style={{ width:72, height:72, borderRadius:'50%', background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:24, fontSize:30 }}>🌙</div>
      <h2 style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:20, color:'white', margin:'0 0 8px' }}>健身房已打烊</h2>
      <p style={{ color:'rgba(255,255,255,0.4)', margin:'0 0 28px', fontSize:14 }}>營業時間 06:00 – 22:00</p>
      <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'18px 32px' }}>
        <div style={{ color:'rgba(255,255,255,0.35)', fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:8 }}>距明日開門</div>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:32, fontWeight:500, color:'white', letterSpacing:'0.05em' }}>{cd}</div>
      </div>
      <a href="https://www.daansports.com.tw" target="_blank" rel="noopener noreferrer"
        style={{ marginTop:36, display:'inline-flex', alignItems:'center', gap:8, color:'rgba(255,255,255,0.3)', fontSize:12, textDecoration:'none' }}>
        <GlobeIcon/> daansports.com.tw
      </a>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
const POLL_MS = 20_000;

export default function App() {
  const [gymData,   setGymData]   = useState(null);
  const [history,   setHistory]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [lastFetch, setLastFetch] = useState(null);
  const [error,     setError]     = useState(false);
  const [open,      setOpen]      = useState(isGymOpen);
  const timer = useRef(null);

  const fetchData = useCallback(async (spinner = false) => {
    if (spinner) setLoading(true);
    try {
      const isDev = import.meta.env?.DEV;
      const BASE = isDev ? '.' : 'https://raw.githubusercontent.com/xk4nk4zo4j4/daan-gym-monitor/main/public';
      const bust = `?v=${Date.now()}`;
      
      // 1. Fetch history from GitHub (or local)
      const rhP = fetch(`${BASE}/history.json${bust}`).then(r => r.json()).catch(() => []);
      
      // 2. Try fetching real-time data from daansports directly via CORS proxies
      let currentVal = null, maxVal = null;
      if (!isDev) {
        try {
          const targetUrl = encodeURIComponent('https://www.daansports.com.tw/zh_TW/onsitenum?v=' + Date.now());
          const proxies = [
            `https://api.allorigins.win/raw?url=${targetUrl}`,
            `https://api.codetabs.com/v1/proxy?quest=${targetUrl}`,
            `https://corsproxy.io/?url=${targetUrl}`
          ];
          
          const rawHtml = await Promise.any(
            proxies.map(url => fetch(url, { signal: AbortSignal.timeout(8000) }).then(r => {
              if (!r.ok) throw new Error('Proxy error');
              return r.text();
            }))
          );
          
          const curMatch = rawHtml.match(/健身房[^0-9]*([0-9]+)[^0-9]*人/);
          const maxMatch = rawHtml.match(/健身房.*容留[^0-9]*([0-9]+)[^0-9]*人/);
          if (curMatch) currentVal = parseInt(curMatch[1], 10);
          if (maxMatch) maxVal = parseInt(maxMatch[1], 10);
        } catch (e) {
          console.warn('All CORS proxies failed or timed out:', e);
        }
      }

      // 3. Fetch data.json as fallback (and for dev)
      const dataP = fetch(`${BASE}/data.json${bust}`).then(r => r.json());
      
      const [historyData, githubData] = await Promise.all([rhP, dataP]);
      
      // 4. Combine real-time data if available, else fallback to github's parsed data
      const finalGym = {
        current: currentVal !== null ? currentVal : githubData?.gym?.current,
        max: maxVal !== null ? maxVal : githubData?.gym?.max || 80
      };

      setGymData({ gym: finalGym });
      setHistory(Array.isArray(historyData) ? historyData : []);
      setLastFetch(new Date());
      setError(false);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
    const ck = setInterval(() => setOpen(isGymOpen()), 60_000);
    return () => clearInterval(ck);
  }, [fetchData]);

  useEffect(() => {
    if (open) timer.current = setInterval(() => fetchData(true), POLL_MS);
    else      clearInterval(timer.current);
    return () => clearInterval(timer.current);
  }, [open, fetchData]);

  if (!open) return <ClosedScreen />;

  const gym    = gymData?.gym;
  const level  = gym ? getLevel(gym.current, gym.max) : null;
  const accent = level?.color ?? '#6366f1';

  const chartData = history.length > 120
    ? history.filter((_, i) => i % Math.ceil(history.length / 120) === 0)
    : history;

  const busyHour = (() => {
    if (history.length < 3) return null;
    const byHour = {};
    history.forEach(p => {
      const h = new Date(p.timestamp).getHours();
      byHour[h] = byHour[h] ? (byHour[h] + p.current) / 2 : p.current;
    });
    const peak = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0];
    return peak ? `${peak[0]}:00` : null;
  })();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { background:#0a0a0f; color:white; font-family:'DM Sans',sans-serif; min-height:100vh; }
        @keyframes ping    { 75%,100%{ transform:scale(2); opacity:0; } }
        @keyframes fadeUp  { from{ opacity:0; transform:translateY(14px); } to{ opacity:1; transform:translateY(0); } }
        @keyframes spin    { to{ transform:rotate(360deg); } }
        @keyframes shimmer { from{ background-position:-400px 0; } to{ background-position:400px 0; } }
        .card { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:18px; animation:fadeUp 0.5s ease both; }
        .skeleton { background:linear-gradient(90deg,rgba(255,255,255,0.06) 25%,rgba(255,255,255,0.1) 50%,rgba(255,255,255,0.06) 75%); background-size:400px 100%; animation:shimmer 1.4s infinite; border-radius:8px; }
        .spin { animation:spin 1s linear infinite; }
        .rbtn { background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:10px 14px; color:rgba(255,255,255,0.7); cursor:pointer; display:flex; align-items:center; gap:6px; font-family:'DM Sans',sans-serif; font-size:13px; transition:background 0.15s,transform 0.1s; white-space:nowrap; }
        .rbtn:hover { background:rgba(255,255,255,0.1); }
        .rbtn:active { transform:scale(0.96); }
        .rbtn:disabled { opacity:0.4; cursor:not-allowed; }
        .main-grid { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,2fr); gap:14px; margin-bottom:14px; }
        .stat-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-bottom:10px; }
        @media (max-width:600px) { .main-grid { grid-template-columns:1fr; } }
      `}</style>

      <div style={{ maxWidth:960, margin:'0 auto', padding:'28px 16px 56px' }}>

        {/* header */}
        <header style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, animation:'fadeUp 0.4s ease' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
              <PulsingDot color={accent}/>
              <span style={{ fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', color:accent, fontWeight:500 }}>即時監測中</span>
            </div>
            <h1 style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:'clamp(20px,5vw,28px)', letterSpacing:'-0.02em', lineHeight:1.2 }}>
              大安運動中心<span style={{ color:'rgba(255,255,255,0.3)', fontWeight:400 }}> · 健身房</span>
            </h1>
          </div>
          <button className="rbtn" onClick={() => fetchData(true)} disabled={loading}>
            <svg className={loading ? 'spin' : ''} width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            更新
          </button>
        </header>

        {/* main grid */}
        <div className="main-grid">

          {/* occupancy */}
          <div className="card" style={{ padding:24, animationDelay:'0.05s' }}>
            <div style={{ fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)', marginBottom:18 }}>目前人數</div>
            {loading && !gym
              ? <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, padding:'16px 0' }}>
                  <div className="skeleton" style={{ width:140, height:140, borderRadius:'50%' }}/>
                  <div className="skeleton" style={{ width:70, height:14 }}/>
                </div>
              : error
                ? <div style={{ textAlign:'center', color:'rgba(255,255,255,0.3)', padding:'28px 0', fontSize:13 }}>同步失敗，稍後重試</div>
                : gym
                  ? <OccupancyRing current={gym.current} max={gym.max}/>
                  : null
            }
            {lastFetch && (
              <div style={{ marginTop:18, display:'flex', alignItems:'center', justifyContent:'center', gap:5, fontSize:11, color:'rgba(255,255,255,0.22)' }}>
                <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                {lastFetch.toLocaleTimeString('zh-TW', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false })}
              </div>
            )}
          </div>

          {/* chart */}
          <div className="card" style={{ padding:24, animationDelay:'0.1s' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
              <div>
                <div style={{ fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)', marginBottom:3 }}>人流趨勢</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>近 7 日歷史記錄</div>
              </div>
              {busyHour && (
                <div style={{ background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'4px 10px', fontSize:11, color:'#fca5a5', whiteSpace:'nowrap' }}>
                  尖峰 {busyHour}
                </div>
              )}
            </div>
            {chartData.length < 3
              ? <div style={{ height:200, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.2)', fontSize:13, gap:8 }}>
                  <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                  正在累積數據…
                </div>
              : <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData} margin={{ top:4, right:4, left:-28, bottom:0 }}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={accent} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={accent} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                    <XAxis dataKey="label" hide={chartData.length > 60} axisLine={false} tickLine={false}
                      tick={{ fontSize:10, fill:'rgba(255,255,255,0.25)', fontFamily:"'DM Mono',monospace" }}/>
                    <YAxis axisLine={false} tickLine={false} domain={[0, gym?.max || 80]}
                      tick={{ fontSize:10, fill:'rgba(255,255,255,0.25)', fontFamily:"'DM Mono',monospace" }}/>
                    <Tooltip content={<CustomTooltip/>} cursor={{ stroke:'rgba(255,255,255,0.08)', strokeWidth:1 }}/>
                    <ReferenceLine y={gym ? Math.round(gym.max * 0.75) : 60}
                      stroke="rgba(239,68,68,0.25)" strokeDasharray="4 4"
                      label={{ value:'擁擠線', position:'right', fill:'rgba(239,68,68,0.4)', fontSize:10 }}/>
                    <Area type="monotone" dataKey="current" stroke={accent} strokeWidth={2}
                      fill="url(#grad)" dot={false} activeDot={{ r:4, fill:accent, strokeWidth:0 }}/>
                  </AreaChart>
                </ResponsiveContainer>
            }
          </div>
        </div>

        {/* stat row */}
        {gym && (
          <div className="stat-grid">
            {[
              { label:'使用率',   value:`${Math.round((gym.current / gym.max) * 100)}%`, sub:level?.label,  color:accent },
              { label:'剩餘名額', value:gym.max - gym.current,                            sub:'人可入場',    color:'white' },
              { label:'容留上限', value:gym.max,                                          sub:'人',          color:'rgba(255,255,255,0.45)' },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="card" style={{ padding:'18px 16px', animationDelay:'0.15s' }}>
                <div style={{ fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', marginBottom:8 }}>{label}</div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'clamp(20px,4vw,26px)', fontWeight:500, color, lineHeight:1, marginBottom:5 }}>{value}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)' }}>{sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* info banner */}
        <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:14, padding:'14px 18px', display:'flex', alignItems:'flex-start', gap:12, fontSize:12, color:'rgba(255,255,255,0.28)', lineHeight:1.6, animation:'fadeUp 0.5s ease both', animationDelay:'0.2s', marginBottom:10 }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:2, opacity:0.5 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          前端系統每 20 秒自動更新即時人數。{busyHour ? `根據歷史數據分析，尖峰時段約為 ${parseInt(busyHour)}:00 – ${parseInt(busyHour) + 2}:00，建議避開。` : ''}
        </div>

        {/* footer */}
        <footer style={{ marginTop:36, display:'flex', justifyContent:'center', animation:'fadeUp 0.5s ease both', animationDelay:'0.25s' }}>
          <a href="https://www.daansports.com.tw" target="_blank" rel="noopener noreferrer"
            style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'12px 22px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, textDecoration:'none', color:'rgba(255,255,255,0.5)', fontSize:13, transition:'background 0.15s,color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='rgba(255,255,255,0.8)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='rgba(255,255,255,0.5)'; }}
          >
            <GlobeIcon/>
            大安運動中心官網
            <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity:0.45 }}>
              <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
            </svg>
          </a>
        </footer>

      </div>
    </>
  );
}
