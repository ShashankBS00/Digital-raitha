import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import agroIntelService from '../services/agroIntelService';

/* ── Google Font (Inter) injected once ───────────────────────── */
const FONT_LINK_ID = 'soil-inter-font';
if (typeof document !== 'undefined' && !document.getElementById(FONT_LINK_ID)) {
  const link = document.createElement('link');
  link.id = FONT_LINK_ID;
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
  document.head.appendChild(link);
}

/* ── Design tokens ───────────────────────────────────────────── */
const C = {
  bg:        '#0f1923',
  surface:   '#172130',
  card:      '#1e2d3d',
  border:    'rgba(255,255,255,0.06)',
  green:     '#22c55e',
  greenDim:  '#166534',
  teal:      '#0ea5e9',
  amber:     '#f59e0b',
  red:       '#ef4444',
  purple:    '#a78bfa',
  text:      '#f0f4f8',
  textMuted: '#8a9bb0',
  textFaint: '#4a5c6e',
};

/* ── Primitives ──────────────────────────────────────────────── */
const s = (base, extra = {}) => ({ fontFamily: "'Inter', 'Segoe UI', sans-serif", ...base, ...extra });

const Card = ({ children, style = {} }) => (
  <div style={s({
    background: C.card,
    borderRadius: '20px',
    padding: '22px',
    border: `1px solid ${C.border}`,
    ...style,
  })}>{children}</div>
);

const SectionTitle = ({ icon, title, badge }) => (
  <div style={s({ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' })}>
    <span style={{ fontSize: '20px', lineHeight: 1 }}>{icon}</span>
    <span style={s({ fontSize: '15px', fontWeight: '700', color: C.text, letterSpacing: '-0.01em' })}>
      {title}
    </span>
    {badge && (
      <span style={s({
        marginLeft: 'auto', fontSize: '11px', fontWeight: '600',
        padding: '3px 10px', borderRadius: '20px',
        background: 'rgba(34,197,94,0.15)', color: C.green, border: `1px solid ${C.greenDim}`,
      })}>{badge}</span>
    )}
  </div>
);

const DataRow = ({ label, value, valueColor = C.text, borderColor = C.border }) => (
  <div style={s({
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 0', borderBottom: `1px solid ${borderColor}`,
  })}>
    <span style={s({ fontSize: '13px', color: C.textMuted })}>{label}</span>
    <span style={s({ fontSize: '14px', fontWeight: '700', color: valueColor })}>{value}</span>
  </div>
);

/* pH gradient bar */
const PHBar = ({ ph }) => {
  if (ph === 'N/A' || ph == null) return null;
  const pct = Math.min(Math.max(((ph - 4) / 6) * 100, 0), 100);
  const color = ph < 6 ? C.red : ph > 7.5 ? C.amber : C.green;
  const label = ph < 6 ? 'Acidic' : ph > 7.5 ? 'Alkaline' : 'Optimal';

  return (
    <div style={s({ marginTop: '6px' })}>
      <div style={s({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' })}>
        <span style={s({ fontSize: '12px', fontWeight: '600', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' })}>
          pH Level
        </span>
        <div style={s({ display: 'flex', alignItems: 'center', gap: '6px' })}>
          <span style={s({ fontSize: '22px', fontWeight: '900', color })}>{ph}</span>
          <span style={s({
            fontSize: '11px', fontWeight: '700', padding: '2px 10px', borderRadius: '20px',
            background: `${color}18`, color, border: `1px solid ${color}40`,
          })}>{label}</span>
        </div>
      </div>
      {/* Track */}
      <div style={s({ position: 'relative', height: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', overflow: 'visible' })}>
        {/* Gradient fill */}
        <div style={s({
          position: 'absolute', left: 0, top: 0,
          height: '100%', width: `${pct}%`,
          borderRadius: '6px',
          background: `linear-gradient(90deg, ${C.red}, ${C.amber} 50%, ${C.green})`,
          transition: 'width 1s ease',
        })} />
        {/* Thumb */}
        <div style={s({
          position: 'absolute', top: '50%',
          left: `${pct}%`, transform: 'translate(-50%, -50%)',
          width: '16px', height: '16px', borderRadius: '50%',
          background: color, border: '3px solid #0f1923',
          boxShadow: `0 0 10px ${color}`,
        })} />
      </div>
      <div style={s({ display: 'flex', justifyContent: 'space-between', marginTop: '8px' })}>
        <span style={s({ fontSize: '11px', color: C.red })}>Acidic (4)</span>
        <span style={s({ fontSize: '11px', color: C.green, fontWeight: '600' })}>Optimal (6–7.5)</span>
        <span style={s({ fontSize: '11px', color: C.amber })}>Alkaline (10)</span>
      </div>
    </div>
  );
};

/* Donut / stacked bar for soil texture */
const TextureBar = ({ sandRaw, siltRaw, clayRaw }) => {
  const sand = parseFloat(sandRaw) || 0;
  const silt = parseFloat(siltRaw) || 0;
  const clay = parseFloat(clayRaw) || 0;
  const total = sand + silt + clay || 100;
  const pSand = (sand / total) * 100;
  const pSilt = (silt / total) * 100;
  const pClay = (clay / total) * 100;

  if (!sand && !silt && !clay) return null;

  const segments = [
    { label: 'Sand', pct: pSand, color: '#f59e0b', raw: `${sand}%` },
    { label: 'Silt', pct: pSilt, color: '#0ea5e9', raw: `${silt}%` },
    { label: 'Clay', pct: pClay, color: '#a78bfa', raw: `${clay}%` },
  ];

  return (
    <div style={s({ marginTop: '14px' })}>
      <p style={s({ fontSize: '12px', fontWeight: '600', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' })}>
        Texture Composition
      </p>
      <div style={s({ display: 'flex', height: '10px', borderRadius: '8px', overflow: 'hidden', gap: '2px' })}>
        {segments.map(seg => (
          <div key={seg.label} style={s({
            height: '100%', borderRadius: '4px',
            width: `${seg.pct}%`,
            background: seg.color,
            transition: 'width 0.8s ease',
          })} />
        ))}
      </div>
      <div style={s({ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' })}>
        {segments.map(seg => (
          <div key={seg.label} style={s({ display: 'flex', alignItems: 'center', gap: '6px' })}>
            <div style={s({ width: '10px', height: '10px', borderRadius: '3px', background: seg.color, flexShrink: 0 })} />
            <span style={s({ fontSize: '12px', color: C.textMuted })}>{seg.label}</span>
            <span style={s({ fontSize: '12px', fontWeight: '700', color: seg.color })}>{seg.raw}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* Soil health score ring */
const SoilScoreRing = ({ ph, organicCarbon, nitrogen }) => {
  let score = 50;
  const phNum = parseFloat(ph);
  const ocNum = parseFloat(organicCarbon);
  const nNum  = parseFloat(nitrogen);

  if (!isNaN(phNum)) {
    if (phNum >= 6 && phNum <= 7.5) score += 20;
    else if (phNum >= 5.5 && phNum <= 8) score += 8;
  }
  if (!isNaN(ocNum)) {
    if (ocNum >= 1.5) score += 20;
    else if (ocNum >= 0.8) score += 10;
  }
  if (!isNaN(nNum)) {
    if (nNum >= 150) score += 10;
    else if (nNum >= 80) score += 5;
  }
  score = Math.min(score, 100);

  const color = score >= 75 ? C.green : score >= 50 ? C.amber : C.red;
  const label = score >= 75 ? 'Excellent' : score >= 50 ? 'Moderate' : 'Poor';
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div style={s({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' })}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          strokeDashoffset={circ * 0.25}
          style={{ transition: 'stroke-dasharray 1.2s ease', filter: `drop-shadow(0 0 6px ${color})` }}
        />
        <text x="50" y="46" textAnchor="middle" fill={color} fontSize="18" fontWeight="900" fontFamily="Inter,sans-serif">{score}</text>
        <text x="50" y="60" textAnchor="middle" fill={C.textFaint} fontSize="9" fontFamily="Inter,sans-serif">/100</text>
      </svg>
      <span style={s({ fontSize: '12px', fontWeight: '700', color, letterSpacing: '0.04em', textTransform: 'uppercase' })}>{label}</span>
      <span style={s({ fontSize: '11px', color: C.textMuted })}>Soil Health Score</span>
    </div>
  );
};

/* Nutrient meter bar */
const NutrientMeter = ({ label, value, rawValue, maxRef, color = C.teal, unit = '' }) => {
  const pct = rawValue != null ? Math.min((rawValue / maxRef) * 100, 100) : 0;
  return (
    <div style={s({ marginBottom: '14px' })}>
      <div style={s({ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' })}>
        <span style={s({ fontSize: '13px', color: C.textMuted })}>{label}</span>
        <span style={s({ fontSize: '13px', fontWeight: '700', color })}>{value || 'N/A'}</span>
      </div>
      <div style={s({ height: '6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' })}>
        <div style={s({
          height: '100%', borderRadius: '4px',
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          transition: 'width 1s ease',
          boxShadow: `0 0 8px ${color}60`,
        })} />
      </div>
    </div>
  );
};

/* ── Main Component ──────────────────────────────────────────── */
const SoilAnalysisComponent = ({ lat, lon, aiRecommendations }) => {
  const { t } = useTranslation();
  const [soilData, setSoilData] = useState(null);
  const [soilLoading, setSoilLoading] = useState(true);
  const [soilError, setSoilError] = useState('');
  const cachedLocation = useRef(null);

  useEffect(() => {
    const fetchSoilAnalysis = async () => {
      const latNum = Number(lat);
      const lonNum = Number(lon);
      if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
        setSoilData(null); setSoilLoading(false); return;
      }
      if (
        cachedLocation.current &&
        Math.abs(cachedLocation.current.lat - latNum) < 0.01 &&
        Math.abs(cachedLocation.current.lon - lonNum) < 0.01
      ) { setSoilLoading(false); return; }

      cachedLocation.current = { lat: latNum, lon: lonNum };
      setSoilLoading(true); setSoilError('');
      try {
        const raw = await agroIntelService.fetchSoilData(latNum, lonNum);
        setSoilData({
          pH: raw.ph != null ? raw.ph : 'N/A',
          texture: raw.sand != null && raw.clay != null && raw.silt != null
            ? agroIntelService.determineSoilTexture(raw.sand, raw.silt, raw.clay) : 'N/A',
          organicCarbon: raw.organic_carbon != null ? `${raw.organic_carbon}%` : 'N/A',
          nitrogen: raw.nitrogen != null ? `${raw.nitrogen} kg/ha` : 'N/A',
          cec: raw.cec != null ? `${raw.cec} cmol/kg` : 'N/A',
          sand: raw.sand != null ? `${raw.sand}%` : 'N/A',
          silt: raw.silt != null ? `${raw.silt}%` : 'N/A',
          clay: raw.clay != null ? `${raw.clay}%` : 'N/A',
          _raw: raw,
        });
      } catch (err) {
        console.error('Error fetching soil data:', err);
        setSoilError('Could not fetch live soil data. Showing estimated values.');
        setSoilData({
          pH: 6.8, texture: 'Loamy', organicCarbon: '1.2%',
          nitrogen: '150 kg/ha', cec: '12 cmol/kg', sand: '45%', silt: '35%', clay: '20%',
          _raw: { ph: 6.8, organic_carbon: 1.2, nitrogen: 150, sand: 45, silt: 35, clay: 20 },
        });
      } finally {
        setSoilLoading(false);
      }
    };
    fetchSoilAnalysis();
  }, [lat, lon]);

  const phColor =
    soilData?.pH === 'N/A' ? C.textMuted
    : soilData?.pH < 6 ? C.red
    : soilData?.pH > 7.5 ? C.amber
    : C.green;

  return (
    <div style={s({
      background: C.bg,
      borderRadius: '24px',
      padding: '0',
      overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      minHeight: '400px',
    })}>

      {/* ── Header ── */}
      <div style={s({
        background: 'linear-gradient(135deg, #0d2137 0%, #112d45 55%, #0f2334 100%)',
        padding: '28px 30px 22px',
        borderBottom: `1px solid ${C.border}`,
        position: 'relative',
        overflow: 'hidden',
      })}>
        {/* Decorative glows */}
        <div style={s({ position:'absolute',top:'-40px',right:'-40px',width:'180px',height:'180px',borderRadius:'50%',background:'rgba(34,197,94,0.06)' })} />
        <div style={s({ position:'absolute',bottom:'-30px',left:'40px',width:'120px',height:'120px',borderRadius:'50%',background:'rgba(14,165,233,0.05)' })} />

        <div style={s({ position:'relative',zIndex:1,display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:'16px' })}>
          <div style={s({ display:'flex',alignItems:'center',gap:'14px' })}>
            <div style={s({
              width:'50px',height:'50px',borderRadius:'16px',
              background:'linear-gradient(135deg,#1e4030,#166534)',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:'24px',
              boxShadow:'0 4px 18px rgba(22,101,52,0.5)',
            })}>🌍</div>
            <div>
              <h2 style={s({ margin:0,fontSize:'22px',fontWeight:'900',color:C.text,letterSpacing:'-0.03em' })}>
                {t('soilAnalysisReport') || 'Soil Analysis Report'}
              </h2>
              <p style={s({ margin:0,fontSize:'13px',color:C.textMuted,marginTop:'3px' })}>
                📍 {Number(lat).toFixed(4)}, {Number(lon).toFixed(4)} · SoilGrids API
              </p>
            </div>
          </div>

          {soilLoading && (
            <div style={s({ display:'flex',alignItems:'center',gap:'8px',padding:'8px 14px',borderRadius:'12px',background:'rgba(14,165,233,0.1)',border:`1px solid ${C.teal}30` })}>
              <svg style={{ width:'14px',height:'14px',animation:'spin 1s linear infinite',color:C.teal }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle style={{opacity:.25}} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path style={{opacity:.75}} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <span style={s({ fontSize:'13px',fontWeight:'600',color:C.teal })}>Fetching live data…</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={s({ padding:'24px',display:'flex',flexDirection:'column',gap:'18px' })}>

        {/* Error banner */}
        {soilError && (
          <div style={s({
            padding:'12px 16px',borderRadius:'12px',
            background:'rgba(245,158,11,0.1)',border:`1px solid ${C.amber}30`,
            color:C.amber,fontSize:'13px',display:'flex',alignItems:'center',gap:'8px',
          })}>
            ⚠️ {soilError}
          </div>
        )}

        {soilLoading && !soilData ? (
          <div style={s({ textAlign:'center',padding:'60px 0',color:C.textMuted,fontSize:'14px' })}>
            <div style={s({ fontSize:'36px',marginBottom:'12px' })}>🌱</div>
            Analyzing your soil…
          </div>
        ) : soilData ? (
          <>
            {/* Row 1: Score + Properties + pH */}
            <div style={s({ display:'grid',gridTemplateColumns:'auto 1fr 1fr',gap:'16px',alignItems:'stretch' })}>

              {/* Health Score */}
              <Card style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'24px 18px',gap:'0' }}>
                <SoilScoreRing
                  ph={soilData.pH}
                  organicCarbon={soilData.organicCarbon}
                  nitrogen={soilData._raw?.nitrogen}
                />
              </Card>

              {/* Soil Properties */}
              <Card>
                <SectionTitle icon="🌏" title={t('soilProperties') || 'Soil Properties'} />
                <div>
                  <DataRow
                    label={t('phLevel') || 'pH Level'}
                    value={soilData.pH}
                    valueColor={phColor}
                    borderColor={C.border}
                  />
                  <DataRow label={t('texture') || 'Texture'} value={soilData.texture} borderColor={C.border} />
                  <DataRow label={t('organicCarbon') || 'Organic Carbon'} value={soilData.organicCarbon} valueColor={C.green} borderColor={C.border} />
                  {soilData.cec !== 'N/A' && (
                    <DataRow label="CEC" value={soilData.cec} valueColor={C.purple} borderColor={C.border} />
                  )}
                </div>
                <TextureBar
                  sandRaw={parseFloat(soilData.sand)}
                  siltRaw={parseFloat(soilData.silt)}
                  clayRaw={parseFloat(soilData.clay)}
                />
              </Card>

              {/* pH Bar */}
              <Card>
                <SectionTitle icon="🧪" title={t('nutrientContent') || 'Nutrient Content'} />
                <NutrientMeter
                  label={t('nitrogen') || 'Nitrogen'}
                  value={soilData.nitrogen}
                  rawValue={soilData._raw?.nitrogen}
                  maxRef={300}
                  color={soilData._raw?.nitrogen != null && soilData._raw.nitrogen < 150 ? C.red : C.teal}
                  unit="kg/ha"
                />
                <NutrientMeter
                  label={t('organicCarbon') || 'Organic Carbon'}
                  value={soilData.organicCarbon}
                  rawValue={soilData._raw?.organic_carbon}
                  maxRef={5}
                  color={C.green}
                />
                {soilData.pH !== 'N/A' && <PHBar ph={soilData.pH} />}
              </Card>
            </div>

            {/* Row 2: AI Recommendations */}
            <Card>
              <SectionTitle
                icon="🤖"
                title={t('aiSoilManagement') || 'AI Soil Management Recommendations'}
                badge="AI Powered"
              />
              {aiRecommendations ? (
                <div style={s({ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'10px' })}>
                  {aiRecommendations.soilManagement.map((rec, i) => (
                    <div key={i} style={s({
                      display:'flex',alignItems:'flex-start',gap:'10px',
                      padding:'12px 14px',borderRadius:'12px',
                      background:'rgba(34,197,94,0.06)',
                      border:`1px solid ${C.greenDim}40`,
                    })}>
                      <div style={s({
                        width:'22px',height:'22px',borderRadius:'50%',flexShrink:0,
                        background:`${C.green}18`,
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:'12px',fontWeight:'800',color:C.green,
                        marginTop:'1px',
                      })}>{i + 1}</div>
                      <span style={s({ fontSize:'13px',color:C.text,lineHeight:'1.55' })}>{rec}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={s({ fontSize:'13px',color:C.textMuted,fontStyle:'italic' })}>
                  {t('loadingRecommendations') || 'Loading recommendations…'}
                </p>
              )}
            </Card>
          </>
        ) : (
          <p style={s({ color:C.textMuted,fontSize:'14px' })}>{t('loadingSoilData') || 'Loading soil data…'}</p>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default SoilAnalysisComponent;
