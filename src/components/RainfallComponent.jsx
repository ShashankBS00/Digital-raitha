import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

/* ── Inject Inter font once ─────────────────────────────────── */
const FONT_ID = 'rainfall-inter-font';
if (typeof document !== 'undefined' && !document.getElementById(FONT_ID)) {
  const link = document.createElement('link');
  link.id = FONT_ID;
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
  document.head.appendChild(link);
}

/* ── Design tokens ───────────────────────────────────────────── */
const C = {
  bg:      '#0f1923',
  card:    '#1e2d3d',
  border:  'rgba(255,255,255,0.07)',
  blue:    '#38bdf8',
  teal:    '#2dd4bf',
  indigo:  '#818cf8',
  amber:   '#fbbf24',
  green:   '#4ade80',
  red:     '#f87171',
  text:    '#f0f4f8',
  muted:   '#8a9bb0',
  faint:   '#3d5166',
};

const ff = "'Inter','Segoe UI',sans-serif";

/* ── Helpers ────────────────────────────────────────────────── */
const parseSeasons = (seasonal) => {
  // e.g. "Monsoon: 1264 mm, Winter: 0 mm, Summer: 112 mm"
  const seasons = [];
  const regex = /(\w+):\s*([\d.]+)\s*mm/g;
  let match;
  while ((match = regex.exec(seasonal)) !== null) {
    seasons.push({ name: match[1], value: parseFloat(match[2]) });
  }
  return seasons;
};

const seasonMeta = {
  Monsoon: { icon: '🌧️', color: C.blue,   bg: 'rgba(56,189,248,0.1)'  },
  Summer:  { icon: '☀️',  color: C.amber,  bg: 'rgba(251,191,36,0.1)'  },
  Winter:  { icon: '❄️',  color: C.indigo, bg: 'rgba(129,140,248,0.1)' },
  Other:   { icon: '🌦️', color: C.teal,   bg: 'rgba(45,212,191,0.1)'  },
};

const wetnessConfig = {
  Dry:      { pct: 18,  color: C.amber, label: 'Dry',      icon: '🏜️' },
  Moderate: { pct: 52,  color: C.blue,  label: 'Moderate', icon: '💧' },
  Wet:      { pct: 85,  color: C.teal,  label: 'Wet',      icon: '🌊' },
};

/* ── Sub-components ─────────────────────────────────────────── */
const Card = ({ children, style = {} }) => (
  <div style={{
    background: C.card, borderRadius: '20px', padding: '22px',
    border: `1px solid ${C.border}`, fontFamily: ff, ...style,
  }}>
    {children}
  </div>
);

const SectionHeader = ({ icon, title, badge }) => (
  <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px' }}>
    <div style={{
      width:'42px', height:'42px', borderRadius:'13px',
      background: 'linear-gradient(135deg,#0c2d48,#1a5f8a)',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:'20px', flexShrink:0,
      boxShadow:'0 3px 12px rgba(56,189,248,0.25)',
    }}>{icon}</div>
    <span style={{ fontFamily:ff, fontSize:'16px', fontWeight:'800', color:C.text, letterSpacing:'-0.02em' }}>
      {title}
    </span>
    {badge && (
      <span style={{
        marginLeft:'auto', fontSize:'11px', fontWeight:'600',
        padding:'3px 10px', borderRadius:'20px',
        background:'rgba(56,189,248,0.1)', color:C.blue, border:`1px solid ${C.blue}30`,
        fontFamily:ff,
      }}>{badge}</span>
    )}
  </div>
);

const SkeletonBar = ({ width = '100%', height = '20px', radius = '8px' }) => (
  <div style={{
    width, height, borderRadius: radius,
    background: 'rgba(255,255,255,0.07)',
    animation: 'rfpulse 1.5s ease-in-out infinite',
  }} />
);

/* ── Main Component ──────────────────────────────────────────── */
const RainfallComponent = ({ lat, lon, aiRecommendations }) => {
  const { t } = useTranslation();
  const [rainfallData, setRainfallData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const formatDate = (date) => date.toISOString().split('T')[0];
  const getSeasonLabel = (month) => {
    if ([6,7,8,9].includes(month)) return 'Monsoon';
    if ([3,4,5].includes(month))   return 'Summer';
    if ([12,1,2].includes(month))  return 'Winter';
    return 'Other';
  };

  useEffect(() => {
    const fetchRainfall = async () => {
      const latNum = Number(lat);
      const lonNum = Number(lon);
      if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) { setRainfallData(null); setLoading(false); return; }
      setLoading(true); setError('');
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setFullYear(endDate.getFullYear() - 1);
      try {
        const response = await axios.get('https://archive-api.open-meteo.com/v1/archive', {
          params: { latitude: latNum, longitude: lonNum, start_date: formatDate(startDate), end_date: formatDate(endDate), daily: 'precipitation_sum', timezone: 'auto' }
        });
        const precipitation = response.data?.daily?.precipitation_sum || [];
        const time = response.data?.daily?.time || [];
        const totalRainfall = precipitation.reduce((sum, v) => sum + (Number(v) || 0), 0);
        const seasonalTotals = { Monsoon: 0, Winter: 0, Summer: 0, Other: 0 };
        time.forEach((ds, i) => {
          const season = getSeasonLabel(new Date(ds).getMonth() + 1);
          seasonalTotals[season] += Number(precipitation[i]) || 0;
        });
        const seasonText = `Monsoon: ${Math.round(seasonalTotals.Monsoon)} mm, Winter: ${Math.round(seasonalTotals.Winter)} mm, Summer: ${Math.round(seasonalTotals.Summer)} mm`;
        const wetness = totalRainfall >= 1000 ? 'Wet' : totalRainfall >= 600 ? 'Moderate' : 'Dry';
        setRainfallData({
          annual: Math.round(totalRainfall),
          seasonal: seasonText,
          soilWetness: wetness,
          seasonalTotals,
        });
      } catch (fetchError) {
        console.error('Error fetching rainfall data:', fetchError);
        setError('Unable to fetch live data. Showing estimated values.');
        setRainfallData({
          annual: 950,
          seasonal: 'Monsoon: 750 mm, Winter: 150 mm, Summer: 50 mm',
          soilWetness: 'Moderate',
          seasonalTotals: { Monsoon: 750, Winter: 150, Summer: 50, Other: 0 },
        });
      } finally { setLoading(false); }
    };
    fetchRainfall();
  }, [lat, lon]);

  const seasons = rainfallData ? parseSeasons(rainfallData.seasonal) : [];
  const maxSeason = Math.max(...seasons.map(s => s.value), 1);
  const wetness = wetnessConfig[rainfallData?.soilWetness] || wetnessConfig.Moderate;

  return (
    <div style={{ fontFamily: ff, display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── RAINFALL ANALYSIS CARD ── */}
      <Card>
        <SectionHeader icon="🌧️" title={t('rainfallAnalysis') || 'Rainfall Analysis'} badge="Open-Meteo API" />

        {/* Error banner */}
        {error && (
          <div style={{
            marginBottom:'16px', padding:'10px 14px', borderRadius:'12px',
            background:'rgba(251,191,36,0.08)', border:`1px solid ${C.amber}30`,
            fontSize:'13px', fontWeight:'500', color:C.amber, fontFamily:ff,
            display:'flex', alignItems:'center', gap:'8px',
          }}>⚠️ {error}</div>
        )}

        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <SkeletonBar height="64px" radius="14px" />
            <SkeletonBar height="14px" width="60%" radius="8px" />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:'10px', marginTop:'8px' }}>
              {[1,2,3].map(i => <SkeletonBar key={i} height="80px" radius="14px" />)}
            </div>
          </div>
        ) : rainfallData ? (
          <>
            {/* ── Annual hero + wetness two-col ── */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'18px', flexWrap:'wrap' }}>

              {/* Annual rainfall */}
              <div style={{
                background:'linear-gradient(135deg,rgba(56,189,248,0.08),rgba(45,212,191,0.08))',
                borderRadius:'16px', padding:'20px',
                border:`1px solid rgba(56,189,248,0.15)`,
                display:'flex', flexDirection:'column', gap:'6px',
              }}>
                <span style={{ fontFamily:ff, fontSize:'11px', fontWeight:'600', color:C.muted, textTransform:'uppercase', letterSpacing:'0.09em' }}>
                  {t('annualRainfall') || 'Annual Rainfall'}
                </span>
                <div style={{ display:'flex', alignItems:'flex-end', gap:'4px', lineHeight:1 }}>
                  <span style={{ fontFamily:ff, fontSize:'clamp(36px,6vw,52px)', fontWeight:'900', color:C.blue, letterSpacing:'-0.03em' }}>
                    {rainfallData.annual}
                  </span>
                  <span style={{ fontFamily:ff, fontSize:'20px', fontWeight:'700', color:`${C.blue}80`, marginBottom:'6px' }}>mm</span>
                </div>
                <span style={{ fontFamily:ff, fontSize:'12px', color:C.muted }}>
                  {t('basedOnHistoricalData') || 'Based on historical data for your region'}
                </span>
              </div>

              {/* Soil wetness */}
              <div style={{
                background:`linear-gradient(135deg,${wetness.color}10,${wetness.color}06)`,
                borderRadius:'16px', padding:'20px',
                border:`1px solid ${wetness.color}20`,
                display:'flex', flexDirection:'column', gap:'10px',
              }}>
                <span style={{ fontFamily:ff, fontSize:'11px', fontWeight:'600', color:C.muted, textTransform:'uppercase', letterSpacing:'0.09em' }}>
                  {t('soilWetnessIndex') || 'Soil Wetness Index'}
                </span>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <span style={{ fontSize:'28px' }}>{wetness.icon}</span>
                  <span style={{ fontFamily:ff, fontSize:'24px', fontWeight:'900', color:wetness.color, letterSpacing:'-0.02em' }}>
                    {wetness.label}
                  </span>
                </div>
                {/* Gradient strip */}
                <div style={{ position:'relative', height:'8px', borderRadius:'6px', background:`linear-gradient(90deg,${C.amber},${C.blue},${C.teal})` }}>
                  <div style={{
                    position:'absolute', top:'50%', left:`${wetness.pct}%`,
                    transform:'translate(-50%,-50%)',
                    width:'16px', height:'16px', borderRadius:'50%',
                    background:wetness.color, border:'3px solid #0f1923',
                    boxShadow:`0 0 10px ${wetness.color}`,
                    transition:'left 1s ease',
                  }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontFamily:ff, fontSize:'10px', color:C.amber, fontWeight:'600' }}>Dry</span>
                  <span style={{ fontFamily:ff, fontSize:'10px', color:C.blue, fontWeight:'600' }}>Moderate</span>
                  <span style={{ fontFamily:ff, fontSize:'10px', color:C.teal, fontWeight:'600' }}>Wet</span>
                </div>
              </div>
            </div>

            {/* ── Seasonal distribution bars ── */}
            <div>
              <p style={{ fontFamily:ff, fontSize:'12px', fontWeight:'600', color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'12px' }}>
                {t('seasonalDistribution') || 'Seasonal Distribution'}
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:'10px' }}>
                {seasons.map(season => {
                  const meta = seasonMeta[season.name] || seasonMeta.Other;
                  const pct = Math.round((season.value / maxSeason) * 100);
                  return (
                    <div key={season.name} style={{
                      background: meta.bg,
                      borderRadius:'14px', padding:'14px 12px',
                      border:`1px solid ${meta.color}20`,
                      display:'flex', flexDirection:'column', gap:'8px',
                    }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ fontSize:'18px' }}>{meta.icon}</span>
                        <span style={{ fontFamily:ff, fontSize:'13px', fontWeight:'800', color:meta.color }}>
                          {Math.round(season.value)}<span style={{ fontSize:'10px', fontWeight:'600', opacity:.7 }}> mm</span>
                        </span>
                      </div>
                      {/* Mini bar */}
                      <div style={{ height:'5px', borderRadius:'4px', background:'rgba(255,255,255,0.06)' }}>
                        <div style={{
                          height:'100%', borderRadius:'4px', width:`${pct}%`,
                          background:`linear-gradient(90deg,${meta.color}60,${meta.color})`,
                          transition:'width 1s ease',
                          boxShadow:`0 0 6px ${meta.color}60`,
                        }} />
                      </div>
                      <span style={{ fontFamily:ff, fontSize:'11px', fontWeight:'600', color:C.muted, letterSpacing:'0.03em' }}>
                        {season.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <p style={{ fontFamily:ff, color:C.muted, fontSize:'14px' }}>
            {t('loadingRainfallData') || 'Loading rainfall data…'}
          </p>
        )}
      </Card>

      {/* ── AI IRRIGATION RECOMMENDATIONS CARD ── */}
      <Card>
        <SectionHeader icon="🤖" title={t('aiIrrigationRecommendations') || 'AI Irrigation Recommendations'} badge="AI Powered" />

        {aiRecommendations ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'10px' }}>
            {(aiRecommendations.irrigation || []).map((rec, i) => (
              <div key={i} style={{
                display:'flex', alignItems:'flex-start', gap:'12px',
                padding:'13px 15px', borderRadius:'13px',
                background:'rgba(45,212,191,0.06)',
                border:`1px solid ${C.teal}20`,
              }}>
                <div style={{
                  width:'24px', height:'24px', borderRadius:'50%', flexShrink:0,
                  background:`${C.teal}18`, color:C.teal,
                  fontFamily:ff, fontSize:'12px', fontWeight:'900',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  marginTop:'1px',
                }}>{i + 1}</div>
                <span style={{ fontFamily:ff, fontSize:'13px', color:C.text, lineHeight:'1.55' }}>{rec}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {[1,2,3].map(i => <SkeletonBar key={i} height="52px" radius="13px" />)}
          </div>
        )}
      </Card>

      <style>{`
        @keyframes rfpulse { 0%,100%{opacity:.5} 50%{opacity:.9} }
      `}</style>
    </div>
  );
};

export default RainfallComponent;
