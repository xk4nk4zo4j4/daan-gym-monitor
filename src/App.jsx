import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

// ─── helpers ────────────────────────────────────────────────────────────────

const OPEN_HOUR  = 6;
const CLOSE_HOUR = 22;

function isGymOpen() {
  const now = new Date();
  const h = now.getHours();
  return h >= OPEN_HOUR && h < CLOSE_HOUR;
}

function nextOpenTime() {
  const now = new Date();
  const open = new Date(now);
  if (now.getHours() >= CLOSE_HOUR) {
    open.setDate(open.getDate() + 1);
  }
  open.setHours(OPEN_HOUR, 0, 0, 0);
  return open;
}

function formatCountdown(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function getOccupancyLevel(current, max) {
  const pct = current / max;
  if (pct < 0.4) return { label: '舒適', key: 'low',  pct };
  if (pct < 0.75) return { label: '適中', key: 'mid',  pct };
  return             { label: '擁擠', key: 'high', pct };
}

// ─── sub-components ─────────────────────────────────────────────────────────

function OccupancyRing({ current, max, size = 200 }) {
  const r = size / 2 - 16;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(current / max, 1);
  const dash = pct * circ;
  const level = getOccupancyLevel(current, max);

  const color = level.key === 'low' ? '#22c55e'
              : level.key === 'mid' ? '#f59e0b'
              :                       '#ef4444';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display:'block', margin:'0 auto' }}>
      {/* track */}
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={12}
      />
      {/* fill */}
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={12}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ * 0.25}
        style={{ transition: 'stroke-dasharray 1s cubic-bezier(.4,0,.2,1), stroke 0.5s' }}
      />
      {/* number */}
      <text
        x={size/2} y={size/2 - 10}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontFamily="'DM Mono', monospace"
        fontSize={size * 0.22}
        fontWeight="500"
      >
        {current}
      </text>
      <text
        x={size/2} y={size/2 + 24}
        textAnchor="middle"
        fill="rgba(255,255,255,0.45)"
        fontFamily="'DM Sans', sans-serif"
        fontSize={13}
      >
        / {max} 人
      </text>
      {/* label */}
      <rect
        x={size/2 - 26} y={size/2 + 46}
        width={52} height={20}
        rx={10}
        fill={color + '28'}
      />
      <text
        x={size/2} y={size/2 + 56}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontFamily="'DM Sans', sans-serif"
        fontSize={11}
        fontWeight="500"
      >
        {level.label}
      </text>
    </svg>
  );
}

function PulsingDot({ color = '#22c55e' }) {
  return (
    <span style={{ position:'relative', display:'inline-flex', width:10, height:10 }}>
      <span style={{
        position:'absolute', inset:0,
        borderRadius:'50%',
        background: color,
        opacity: 0.4,
        animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
      }} />
      <span style={{
        position:'relative', display:'inline-flex',
        width:10, height:10,
        borderRadius:'50%',
        background: color,
      }} />
    </span>
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(15,15,20,0.92)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10,
      padding: '8px 14px',
      fontSize: 13,
    }}>
      <div style={{ color:'rgba(255,255,255,0.5)', marginBottom:4, fontSize:11 }}>
        {payload[0].payload.label}
      </div>
      <div style={{ color:'white', fontFamily:"'DM Mono', monospace", fontWeight:500 }}>
        {payload[0].value} 人
      </div>
    </div>
  );
}

// ─── closed screen ───────────────────────────────────────────────────────────

function ClosedScreen() {
  const [countdown, setCountdown] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = nextOpenTime() - Date.now();
      setCountdown(formatCountdown(diff));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      minHeight:'100vh',
      display:'flex',
      flexDirection:'column',
      alignItems:'center',
      justifyContent:'center',
      textAlign:'center',
      padding:24,
    }}>
      <div style={{
        width:80, height:80,
        borderRadius:'50%',
        background:'rgba(255,255,255,0.05)',
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        marginBottom:28,
        fontSize:34,
      }}>
        🌙
      </div>
      <h2 style={{
        fontFamily:"'DM Sans', sans-serif",
        fontWeight:600,
        fontSize:22,
        color:'white',
        margin:'0 0 8px',
      }}>
        健身房已打烊
      </h2>
      <p style={{ color:'rgba(255,255,255,0.4)', margin:'0 0 32px', fontSize:14 }}>
        營業時間 06:00 – 22:00
      </p>
      <div style={{
        background:'rgba(255,255,255,0.05)',
        border:'1px solid rgba(255,255,255,0.08)',
        borderRadius:16,
        padding:'20px 36px',
      }}>
        <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:10 }}>
          距明日開門
        </div>
        <div style={{
          fontFamily:"'DM Mono', monospace",
          fontSize:36,
          fontWeight:500,
          color:'white',
          letterSpacing:'0.05em',
        }}>
          {countdown}
        </div>
      </div>
      <a
        href="https://www.daansports.com.tw"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginTop:40,
          display:'inline-flex',
          alignItems:'center',
          gap:8,
          color:'rgba(255,255,255,0.35)',
          fontSize:12,
          textDecoration:'none',
          letterSpacing:'0.05em',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        daansports.com.tw
      </a>
    </div>
  );
}

// ─── main app ────────────────────────────────────────────────────────────────

const POLL_INTERVAL = 20_000; // 20 seconds

export default function App() {
  const [gymData,    setGymData]    = useState(null);
  const [history,    setHistory]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [lastFetch,  setLastFetch]  = useState(null);
  const [error,      setError]      = useState(false);
  const [open,       setOpen]       = useState(isGymOpen());
  const timerRef = useRef(null);

  const fetchData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const bust = `?v=${Date.now()}`;
      const [rd, rh] = await Promise.all([
        fetch(`./data.json${bust}`),
        fetch(`./history.json${bust}`),
      ]);
      const data = await rd.json();
      const hist = await rh.json();
      setGymData(data);
      setHistory(Array.isArray(hist) ? hist : []);
      setLastFetch(new Date());
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + polling
  useEffect(() => {
    fetchData(true);
    // Recheck open/closed every minute
    const clockTick = setInterval(() => setOpen(isGymOpen()), 60_000);
    return () => clearInterval(clockTick);
  }, [fetchData]);

  // Only poll when gym is open
  useEffect(() => {
    if (open) {
      timerRef.current = setInterval(() => fetchData(false), POLL_INTERVAL);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [open, fetchData]);

  if (!open) return <ClosedScreen />;

  const gym   = gymData?.gym;
  const level = gym ? getOccupancyLevel(gym.current, gym.max) : null;
  const accentColor = !level ? '#6366f1'
    : level.key === 'low'  ? '#22c55e'
    : level.key === 'mid'  ? '#f59e0b'
    :                        '#ef4444';

  // Thin history for chart if too many points
  const chartData = history.length > 120
    ? history.filter((_, i) => i % Math.ceil(history.length / 120) === 0)
    : history;

  const busyHour = history.length > 2
    ? (() => {
        const byHour = {};
        history.forEach(p => {
          const h = new Date(p.timestamp).getHours();
          byHour[h] = byHour[h] ? (byHour[h] + p.current) / 2 : p.current;
        });
        const peak = Object.entries(byHour).sort((a,b) => b[1]-a[1])[0];
        return peak ? `${peak[0]}:00` : null;
      })()
    : null;

  return (
    <>
      {/* ── global styles ─────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #0a0a0f;
          color: white;
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
        }

        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes fadeUp {
          from { opacity:0; transform: translateY(16px); }
          to   { opacity:1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          from { background-position: -400px 0; }
          to   { background-position:  400px 0; }
        }

        .card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          animation: fadeUp 0.5s ease both;
        }
        .card:hover {
          border-color: rgba(255,255,255,0.12);
          transition: border-color 0.2s;
        }

        .skeleton {
          background: linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.06) 75%);
          background-size: 400px 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 8px;
        }

        .spin { animation: spin 1s linear infinite; }

        .refresh-btn {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 10px 14px;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          transition: background 0.15s, transform 0.1s;
        }
        .refresh-btn:hover  { background: rgba(255,255,255,0.1); }
        .refresh-btn:active { transform: scale(0.96); }
        .refresh-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        a { color: inherit; }
      `}</style>

      {/* ── layout ────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px 60px' }}>

        {/* header */}
        <header style={{
          display:'flex', justifyContent:'space-between', alignItems:'flex-start',
          marginBottom: 36,
          animation: 'fadeUp 0.4s ease',
        }}>
          <div>
            <div style={{
              display:'flex', alignItems:'center', gap:10,
              marginBottom:6,
            }}>
              <PulsingDot color={accentColor} />
              <span style={{
                fontSize:11, letterSpacing:'0.15em', textTransform:'uppercase',
                color: accentColor,
                fontWeight:500,
              }}>
                即時監測中
              </span>
            </div>
            <h1 style={{
              fontFamily:"'DM Sans', sans-serif",
              fontWeight:600,
              fontSize:'clamp(22px, 5vw, 30px)',
              letterSpacing:'-0.02em',
              lineHeight:1.15,
            }}>
              大安運動中心
              <span style={{ color:'rgba(255,255,255,0.3)', fontWeight:400 }}> · 健身房</span>
            </h1>
          </div>

          <button
            className="refresh-btn"
            onClick={() => fetchData(true)}
            disabled={loading}
            title="手動更新"
          >
            <svg
              className={loading ? 'spin' : ''}
              width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            更新
          </button>
        </header>

        {/* ── main grid ─────────────────────────────────────────────────── */}
        <div style={{
          display:'grid',
          gridTemplateColumns:'minmax(0,1fr) minmax(0,2fr)',
          gap:16,
          marginBottom:16,
        }}>
          {/* ─ occupancy card ─ */}
          <div className="card" style={{ padding:28, animationDelay:'0.05s' }}>
            <div style={{
              fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase',
              color:'rgba(255,255,255,0.35)',
              marginBottom:20,
            }}>
              目前人數
            </div>

            {loading && !gym ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16, padding:'20px 0' }}>
                <div className="skeleton" style={{ width:160, height:160, borderRadius:'50%' }} />
                <div className="skeleton" style={{ width:80, height:16 }} />
              </div>
            ) : error ? (
              <div style={{ textAlign:'center', color:'rgba(255,255,255,0.3)', padding:'32px 0', fontSize:13 }}>
                同步失敗，稍後重試
              </div>
            ) : gym ? (
              <OccupancyRing current={gym.current} max={gym.max} size={180} />
            ) : null}

            {/* last sync */}
            {lastFetch && (
              <div style={{
                marginTop:20,
                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                fontSize:11, color:'rgba(255,255,255,0.25)',
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {lastFetch.toLocaleTimeString('zh-TW', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false })}
              </div>
            )}
          </div>

          {/* ─ chart card ─ */}
          <div className="card" style={{ padding:28, animationDelay:'0.1s' }}>
            <div style={{
              display:'flex', justifyContent:'space-between', alignItems:'flex-start',
              marginBottom:20,
            }}>
              <div>
                <div style={{
                  fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase',
                  color:'rgba(255,255,255,0.35)',
                  marginBottom:4,
                }}>
                  人流趨勢
                </div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)' }}>
                  近 7 日歷史記錄
                </div>
              </div>
              {busyHour && (
                <div style={{
                  background:'rgba(239,68,68,0.12)',
                  border:'1px solid rgba(239,68,68,0.2)',
                  borderRadius:8,
                  padding:'5px 10px',
                  fontSize:11,
                  color:'#fca5a5',
                }}>
                  尖峰 {busyHour}
                </div>
              )}
            </div>

            {chartData.length < 3 ? (
              <div style={{
                height:220,
                display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center',
                color:'rgba(255,255,255,0.2)',
                fontSize:13, gap:8,
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                正在累積數據…
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top:4, right:4, left:-28, bottom:0 }}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={accentColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={accentColor} stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    hide={chartData.length > 60}
                    axisLine={false} tickLine={false}
                    tick={{ fontSize:10, fill:'rgba(255,255,255,0.25)', fontFamily:"'DM Mono', monospace" }}
                  />
                  <YAxis
                    axisLine={false} tickLine={false}
                    tick={{ fontSize:10, fill:'rgba(255,255,255,0.25)', fontFamily:"'DM Mono', monospace" }}
                    domain={[0, gym?.max || 80]}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke:'rgba(255,255,255,0.1)', strokeWidth:1 }} />
                  <ReferenceLine
                    y={gym ? Math.round(gym.max * 0.75) : 60}
                    stroke="rgba(239,68,68,0.25)"
                    strokeDasharray="4 4"
                    label={{ value:'擁擠線', position:'right', fill:'rgba(239,68,68,0.45)', fontSize:10 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="current"
                    stroke={accentColor}
                    strokeWidth={2}
                    fill="url(#grad)"
                    dot={false}
                    activeDot={{ r:4, fill:accentColor, strokeWidth:0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── bottom stat row ─────────────────────────────────────────────── */}
        {gym && (
          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(3, minmax(0,1fr))',
            gap:12,
            animation:'fadeUp 0.5s ease both',
            animationDelay:'0.15s',
          }}>
            {[
              {
                label:'使用率',
                value:`${Math.round((gym.current / gym.max) * 100)}%`,
                sub: level?.label,
                color: accentColor,
              },
              {
                label:'剩餘名額',
                value: gym.max - gym.current,
                sub: '人可入場',
                color: 'white',
              },
              {
                label:'容留上限',
                value: gym.max,
                sub: '人',
                color: 'rgba(255,255,255,0.5)',
              },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="card" style={{ padding:'20px 22px', animationDelay:'0.18s' }}>
                <div style={{ fontSize:11, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', marginBottom:10 }}>
                  {label}
                </div>
                <div style={{
                  fontFamily:"'DM Mono', monospace",
                  fontSize:28,
                  fontWeight:500,
                  color,
                  lineHeight:1,
                  marginBottom:6,
                }}>
                  {value}
                </div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>
                  {sub}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── info banner ──────────────────────────────────────────────────── */}
        <div style={{
          marginTop:12,
          background:'rgba(255,255,255,0.02)',
          border:'1px solid rgba(255,255,255,0.05)',
          borderRadius:16,
          padding:'16px 22px',
          display:'flex',
          alignItems:'center',
          gap:14,
          fontSize:13,
          color:'rgba(255,255,255,0.3)',
          animation:'fadeUp 0.5s ease both',
          animationDelay:'0.2s',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, opacity:0.5 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          每分鐘自動同步一次，前端每 20 秒更新顯示。尖峰時段通常為 18:00 – 21:00，建議避開。
        </div>

        {/* ── footer ────────────────────────────────────────────────────────── */}
        <footer style={{
          marginTop:48,
          display:'flex',
          justifyContent:'center',
          animation:'fadeUp 0.5s ease both',
          animationDelay:'0.25s',
        }}>
          <a
            href="https://www.daansports.com.tw"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display:'inline-flex',
              alignItems:'center',
              gap:10,
              padding:'12px 22px',
              background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:14,
              textDecoration:'none',
              color:'rgba(255,255,255,0.5)',
              fontSize:13,
              transition:'background 0.15s, color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
            }}
          >
            {/* globe icon */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            大安運動中心官網
            {/* external arrow */}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity:0.5 }}>
              <line x1="7" y1="17" x2="17" y2="7"/>
              <polyline points="7 7 17 7 17 17"/>
            </svg>
          </a>
        </footer>

      </div>
    </>
  );
}
