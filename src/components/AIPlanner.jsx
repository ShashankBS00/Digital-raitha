import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { auth } from '../firebase';
import planStorageService from '../services/planStorageService';
import FarmerInputForm from './FarmerInputForm';

const formatDate = (date) => date.toISOString().split('T')[0];

const average = (values) => {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

/* ─── Tiny reusable components ─────────────────────────────── */

const SectionCard = ({ icon, title, subtitle, children, accent = '#15803d' }) => (
  <div style={{
    background: 'rgba(255,255,255,0.65)',
    borderRadius: '18px',
    padding: '22px',
    border: '1.5px solid rgba(16,185,129,0.13)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
      <div style={{
        width: '38px', height: '38px', borderRadius: '11px',
        background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px', flexShrink: 0,
        boxShadow: `0 3px 10px ${accent}40`,
      }}>{icon}</div>
      <div>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#14532d', letterSpacing: '-0.01em' }}>{title}</h3>
        {subtitle && <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', marginTop: '1px' }}>{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

const StatCard = ({ label, value, bg = '#f0fdf4', color = '#15803d', prefix = '', suffix = '' }) => (
  <div style={{
    background: bg,
    borderRadius: '14px',
    padding: '16px',
    textAlign: 'center',
    border: `1.5px solid ${color}22`,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 18px ${color}25`; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
  >
    <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
    <p style={{ margin: 0, fontSize: '20px', fontWeight: '800', color, letterSpacing: '-0.02em' }}>{prefix}{value}{suffix}</p>
  </div>
);

const Tag = ({ label, color = '#15803d', bg = '#f0fdf4' }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center',
    padding: '4px 11px', borderRadius: '20px',
    background: bg, color, fontSize: '12px', fontWeight: '600',
    border: `1px solid ${color}30`,
  }}>{label}</span>
);

const MetricRow = ({ label, value, accent = '#6b7280' }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid rgba(0,0,0,0.05)',
  }}>
    <span style={{ fontSize: '13px', color: '#4b5563' }}>{label}</span>
    <span style={{ fontSize: '13px', fontWeight: '700', color: accent }}>{value || 'N/A'}</span>
  </div>
);

/* ─── Main Component ─────────────────────────────────────────── */

const AIPlanner = ({ onLocationChange }) => {
  const { t } = useTranslation();
  const [agroPlan, setAgroPlan] = useState(null);
  const [planInputs, setPlanInputs] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [climateData, setClimateData] = useState(null);
  const [climateLoading, setClimateLoading] = useState(false);
  const [climateError, setClimateError] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [planLoaded, setPlanLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    const loadLatestPlan = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const savedPlan = await planStorageService.getLatestPlan(user.uid);
        if (savedPlan && savedPlan.plan) {
          setAgroPlan(savedPlan.plan);
          setPlanInputs(savedPlan.inputs || null);
        }
      } catch (err) {
        console.error('Error loading saved plan:', err);
      } finally {
        setPlanLoaded(true);
      }
    };
    loadLatestPlan();
  }, []);

  const handlePlanGenerated = async (plan, inputs) => {
    setAgroPlan(plan);
    setPlanInputs(inputs);
    setActiveSection('overview');
    if (onLocationChange && inputs?.latitude && inputs?.longitude) {
      onLocationChange({ lat: inputs.latitude, lng: inputs.longitude });
    }
    const user = auth.currentUser;
    const userId = user ? user.uid : null;
    setSaveStatus('saving');
    try {
      await planStorageService.savePlan(userId, plan, inputs);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      console.error('Error saving plan to Firebase:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 5000);
    }
  };

  const resetForm = () => {
    setAgroPlan(null);
    setPlanInputs(null);
    setLocationName('');
    setLocationLoading(false);
    setLocationError('');
    setClimateData(null);
    setClimateLoading(false);
    setClimateError('');
  };

  useEffect(() => {
    const latitude = Number(agroPlan?.farm_location?.latitude ?? planInputs?.latitude);
    const longitude = Number(agroPlan?.farm_location?.longitude ?? planInputs?.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    let cancelled = false;
    const fetchLocationAndClimate = async () => {
      setLocationLoading(true);
      setClimateLoading(true);
      setLocationError('');
      setClimateError('');
      const climateEnd = new Date();
      const climateStart = new Date(climateEnd);
      climateStart.setDate(climateEnd.getDate() - 364);
      const [locationResult, climateResult] = await Promise.allSettled([
        axios.get('https://nominatim.openstreetmap.org/reverse', {
          params: { format: 'jsonv2', lat: latitude, lon: longitude, 'accept-language': 'en' }
        }),
        axios.get('https://archive-api.open-meteo.com/v1/archive', {
          params: {
            latitude, longitude,
            start_date: formatDate(climateStart),
            end_date: formatDate(climateEnd),
            daily: 'temperature_2m_mean,precipitation_sum,shortwave_radiation_sum',
            timezone: 'auto'
          }
        })
      ]);
      if (!cancelled) {
        if (locationResult.status === 'fulfilled') {
          const address = locationResult.value.data?.address || {};
          const city = address.city || address.town || address.village || address.municipality || address.county;
          const country = address.country;
          setLocationName(city && country ? `${city}, ${country}` : country || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } else {
          setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          setLocationError('Unable to resolve location name');
        }
        setLocationLoading(false);
        if (climateResult.status === 'fulfilled') {
          const daily = climateResult.value.data?.daily || {};
          const tempValues = (daily.temperature_2m_mean || []).filter(v => Number.isFinite(v));
          const precipitationValues = (daily.precipitation_sum || []).filter(v => Number.isFinite(v));
          const solarValues = (daily.shortwave_radiation_sum || []).filter(v => Number.isFinite(v));
          const dayCount = Math.max(tempValues.length, precipitationValues.length, solarValues.length);
          if (dayCount > 0) {
            const avgTemp = average(tempValues);
            const totalRainfall = precipitationValues.reduce((sum, v) => sum + v, 0);
            const annualizedRainfall = totalRainfall * (365 / dayCount);
            const avgSolarMj = average(solarValues);
            const avgSolarKwh = avgSolarMj !== null ? avgSolarMj / 3.6 : null;
            setClimateData({
              avg_rainfall_mm: Math.round(annualizedRainfall),
              avg_temperature_c: avgTemp !== null ? Number(avgTemp.toFixed(1)) : null,
              solar_radiation_kwh_m2_day: avgSolarKwh !== null ? Number(avgSolarKwh.toFixed(1)) : null
            });
          } else {
            setClimateData(null);
            setClimateError('No climate data returned from API');
          }
        } else {
          setClimateData(null);
          setClimateError('Unable to fetch live climate data');
        }
        setClimateLoading(false);
      }
    };
    fetchLocationAndClimate();
    return () => { cancelled = true; };
  }, [agroPlan, planInputs]);

  const displayedRainfall = climateData?.avg_rainfall_mm ?? agroPlan?.climate_summary?.avg_rainfall_mm ?? null;
  const displayedTemperature = climateData?.avg_temperature_c ?? agroPlan?.climate_summary?.avg_temperature_c ?? null;
  const displayedSolar = climateData?.solar_radiation_kwh_m2_day != null
    ? `${climateData.solar_radiation_kwh_m2_day} kWh/m²/day`
    : agroPlan?.climate_summary?.solar_radiation || null;
  const farmLatitude = Number(agroPlan?.farm_location?.latitude);
  const farmLongitude = Number(agroPlan?.farm_location?.longitude);
  const displayedLatitude = Number.isFinite(farmLatitude) ? farmLatitude.toFixed(6) : 'N/A';
  const displayedLongitude = Number.isFinite(farmLongitude) ? farmLongitude.toFixed(6) : 'N/A';

  const sections = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'crops', label: 'Crops & Trees', icon: '🌳' },
    { id: 'economics', label: 'Economics', icon: '💰' },
    { id: 'sustainability', label: 'Sustainability', icon: '♻️' },
    { id: 'nextsteps', label: 'Next Steps', icon: '✅' },
  ];

  // ── Capacity badge map
  const capacityBadge = {
    low: { label: 'Low (< ₹50K)', color: '#d97706', bg: '#fef3c7' },
    medium: { label: 'Medium (₹50K–1L)', color: '#2563eb', bg: '#dbeafe' },
    high: { label: 'High (> ₹1L)', color: '#15803d', bg: '#dcfce7' },
  };
  const cap = capacityBadge[planInputs?.investment_capacity] || { label: 'N/A', color: '#6b7280', bg: '#f3f4f6' };

  return (
    <div style={{
      fontFamily: "'Inter','Segoe UI',sans-serif",
      background: 'linear-gradient(135deg,#f0fdf4 0%,#dcfce7 40%,#d1fae5 100%)',
      borderRadius: '24px',
      overflow: 'hidden',
      boxShadow: '0 8px 40px rgba(16,185,129,0.12),0 2px 8px rgba(0,0,0,0.06)',
    }}>

      {/* ── Header Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg,#14532d 0%,#166534 55%,#15803d 100%)',
        padding: '28px 32px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position:'absolute',top:'-40px',right:'-40px',width:'160px',height:'160px',borderRadius:'50%',background:'rgba(255,255,255,0.05)' }} />
        <div style={{ position:'absolute',bottom:'-30px',right:'100px',width:'100px',height:'100px',borderRadius:'50%',background:'rgba(255,255,255,0.04)' }} />

        <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
            <div style={{
              width:'50px',height:'50px',borderRadius:'16px',
              background:'rgba(255,255,255,0.15)',backdropFilter:'blur(10px)',
              display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',
            }}>🌱</div>
            <div>
              <h2 style={{ margin:0,color:'#fff',fontSize:'22px',fontWeight:'800',letterSpacing:'-0.02em' }}>
                {t('aiDrivenAgroforestryPlanner') || 'AI-Driven Agroforestry Planner'}
              </h2>
              <p style={{ margin:0,color:'rgba(255,255,255,0.6)',fontSize:'13px',marginTop:'3px' }}>
                {agroPlan
                  ? (locationLoading ? 'Resolving location…' : `📍 ${locationName || 'Location ready'}`)
                  : '🌾 Enter your farm details to receive a personalized agroforestry plan'}
              </p>
            </div>
          </div>

          {agroPlan && (
            <button
              onClick={resetForm}
              style={{
                padding:'10px 20px',
                background:'rgba(255,255,255,0.15)',
                color:'#fff',border:'1.5px solid rgba(255,255,255,0.25)',
                borderRadius:'12px',fontSize:'13px',fontWeight:'600',cursor:'pointer',
                backdropFilter:'blur(8px)',transition:'all 0.2s ease',
                display:'flex',alignItems:'center',gap:'6px',
              }}
              onMouseEnter={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.25)'; }}
              onMouseLeave={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.15)'; }}
            >
              ＋ {t('generateNewPlan') || 'New Plan'}
            </button>
          )}
        </div>

        {/* Save status pill */}
        {saveStatus && (
          <div style={{
            position:'relative',zIndex:1,marginTop:'14px',
            display:'inline-flex',alignItems:'center',gap:'8px',
            padding:'7px 14px',borderRadius:'20px',fontSize:'13px',fontWeight:'600',
            background: saveStatus==='saving' ? 'rgba(59,130,246,0.25)' : saveStatus==='saved' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)',
            color: saveStatus==='saving' ? '#bfdbfe' : saveStatus==='saved' ? '#bbf7d0' : '#fecaca',
            border: '1px solid currentColor',
          }}>
            {saveStatus==='saving' && <svg style={{width:'14px',height:'14px',animation:'spin 1s linear infinite'}} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle style={{opacity:.25}} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{opacity:.75}} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>}
            {saveStatus==='saving' && (t('savingPlan') || 'Saving plan to cloud…')}
            {saveStatus==='saved' && '✓ ' + (t('planSaved') || 'Plan saved!')}
            {saveStatus==='error' && '⚠ ' + (t('planSaveError') || 'Could not save — plan available locally.')}
          </div>
        )}

        {/* Section nav (only when plan available) */}
        {agroPlan && (
          <div style={{ position:'relative',zIndex:1,display:'flex',gap:'6px',marginTop:'20px',overflowX:'auto',paddingBottom:'2px' }}>
            {sections.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSection(s.id)}
                style={{
                  padding:'8px 14px',borderRadius:'10px',border:'none',cursor:'pointer',
                  whiteSpace:'nowrap',
                  background: activeSection===s.id ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.07)',
                  color: activeSection===s.id ? '#fff' : 'rgba(255,255,255,0.55)',
                  fontSize:'12px',fontWeight: activeSection===s.id ? '700' : '500',
                  backdropFilter:'blur(6px)',outline:'none',
                  transition:'all 0.2s ease',
                  display:'flex',alignItems:'center',gap:'5px',
                }}
              >
                {s.icon} {s.label}
                {activeSection===s.id && <div style={{width:'16px',height:'2px',background:'#4ade80',borderRadius:'2px',marginLeft:'2px'}} />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ padding:'24px' }}>

        {/* ══ NO PLAN: show input form ══ */}
        {!agroPlan && (
          <div style={{
            background: 'rgba(255,255,255,0.6)',
            borderRadius: '18px',
            padding: '22px',
            border: '1.5px solid rgba(16,185,129,0.15)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}>
            <FarmerInputForm onPlanGenerated={handlePlanGenerated} />
          </div>
        )}

        {/* ══ PLAN AVAILABLE ══ */}
        {agroPlan && (
          <div style={{ display:'flex',flexDirection:'column',gap:'18px' }}>

            {/* ── OVERVIEW TAB ── */}
            {activeSection === 'overview' && (
              <>
                {/* Farm snapshot cards */}
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'14px' }}>
                  <StatCard label="Land Area" value={planInputs?.land_area || '—'} suffix=" acres" bg="#f0fdf4" color="#15803d" />
                  <StatCard label="Investment" value={cap.label} bg={cap.bg} color={cap.color} />
                  <StatCard label="Avg Temp" value={displayedTemperature !== null ? `${displayedTemperature}°C` : climateLoading ? '…' : '—'} bg="#eff6ff" color="#2563eb" />
                  <StatCard label="Annual Rain" value={displayedRainfall !== null ? `${displayedRainfall} mm` : climateLoading ? '…' : '—'} bg="#f0fdf4" color="#059669" />
                  <StatCard label="Solar" value={displayedSolar || (climateLoading ? '…' : '—')} bg="#fefce8" color="#ca8a04" />
                </div>

                {/* Location + Soil two-column */}
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px' }}>
                  {/* Location */}
                  <SectionCard icon="📍" title={t('farmLocation') || 'Farm Location'} accent="#2563eb">
                    <div style={{ display:'flex',flexDirection:'column',gap:'0' }}>
                      <MetricRow label="Location" value={locationLoading ? 'Resolving…' : (locationName || `${displayedLatitude}, ${displayedLongitude}`)} accent="#1d4ed8" />
                      <MetricRow label="Latitude" value={displayedLatitude} />
                      <MetricRow label="Longitude" value={displayedLongitude} />
                      <MetricRow label="Elevation" value={agroPlan?.farm_location?.elevation ? `${agroPlan.farm_location.elevation} m` : null} />
                    </div>
                    {locationError && <p style={{ fontSize:'12px',color:'#b45309',marginTop:'10px' }}>⚠ {locationError}</p>}
                  </SectionCard>

                  {/* Soil */}
                  <SectionCard icon="🌍" title={t('soilSummary') || 'Soil Summary'} accent="#92400e">
                    <div style={{ display:'flex',flexDirection:'column',gap:'0' }}>
                      <MetricRow label="pH Level" value={agroPlan?.soil_summary?.ph} accent="#92400e" />
                      <MetricRow label="Organic Carbon" value={agroPlan?.soil_summary?.organic_carbon} />
                      <MetricRow label="Nitrogen" value={agroPlan?.soil_summary?.nitrogen} />
                      <MetricRow label="Texture" value={agroPlan?.soil_summary?.texture} />
                      <MetricRow label="Drainage" value={agroPlan?.soil_summary?.drainage} />
                    </div>
                    {agroPlan?.soil_summary?.recommendation && (
                      <div style={{ marginTop:'12px',padding:'10px 14px',background:'rgba(146,64,14,0.07)',borderRadius:'10px',fontSize:'13px',color:'#78350f',lineHeight:'1.5' }}>
                        💡 {agroPlan.soil_summary.recommendation}
                      </div>
                    )}
                  </SectionCard>
                </div>

                {/* Climate + Soil tips two-column */}
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px' }}>
                  {/* Climate */}
                  <SectionCard icon="☀️" title={t('climateSummary') || 'Climate Summary'} accent="#d97706">
                    {climateLoading && (
                      <div style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px',fontSize:'13px',color:'#6b7280' }}>
                        <svg style={{width:'14px',height:'14px',animation:'spin 1s linear infinite'}} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle style={{opacity:.25}} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path style={{opacity:.75}} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                        Fetching live climate data…
                      </div>
                    )}
                    <div style={{ display:'flex',flexDirection:'column',gap:'0' }}>
                      <MetricRow label="Avg Rainfall" value={displayedRainfall !== null ? `${displayedRainfall} mm/yr` : null} accent="#0369a1" />
                      <MetricRow label="Avg Temp" value={displayedTemperature !== null ? `${displayedTemperature}°C` : null} accent="#b45309" />
                      <MetricRow label="Solar Radiation" value={displayedSolar} accent="#ca8a04" />
                    </div>
                    {agroPlan?.climate_summary?.recommendation && (
                      <div style={{ marginTop:'12px',padding:'10px 14px',background:'rgba(217,119,6,0.07)',borderRadius:'10px',fontSize:'13px',color:'#92400e',lineHeight:'1.5' }}>
                        💡 {agroPlan.climate_summary.recommendation}
                      </div>
                    )}
                    {climateError && <p style={{ fontSize:'12px',color:'#b45309',marginTop:'10px' }}>⚠ {climateError}</p>}
                  </SectionCard>

                  {/* Soil Improvement Tips */}
                  <SectionCard icon="🌱" title={t('soilImprovementTips') || 'Soil Improvement Tips'} accent="#15803d">
                    <ul style={{ margin:0,padding:0,listStyle:'none',display:'flex',flexDirection:'column',gap:'8px' }}>
                      {(agroPlan?.soil_improvement_tips || []).map((tip, i) => (
                        <li key={i} style={{ display:'flex',alignItems:'flex-start',gap:'8px',fontSize:'13px',color:'#374151',lineHeight:'1.5' }}>
                          <span style={{ color:'#16a34a',fontWeight:'700',flexShrink:0,marginTop:'1px' }}>✓</span>
                          {tip}
                        </li>
                      ))}
                      {!agroPlan?.soil_improvement_tips?.length && <li style={{ fontSize:'13px',color:'#9ca3af' }}>No tips available.</li>}
                    </ul>
                  </SectionCard>
                </div>
              </>
            )}

            {/* ── CROPS & TREES TAB ── */}
            {activeSection === 'crops' && (
              <>
                {/* Layout Plan banner */}
                {agroPlan?.layout_plan && (
                  <div style={{
                    padding:'18px 22px',
                    background:'linear-gradient(135deg,rgba(20,83,45,0.08),rgba(22,163,74,0.12))',
                    borderRadius:'16px',border:'1.5px solid rgba(22,163,74,0.2)',
                    display:'flex',alignItems:'center',gap:'14px',flexWrap:'wrap',
                  }}>
                    <span style={{ fontSize:'24px' }}>📐</span>
                    <div>
                      <p style={{ margin:0,fontSize:'15px',fontWeight:'700',color:'#14532d' }}>
                        {agroPlan.layout_plan.pattern || 'Layout'}
                      </p>
                      <p style={{ margin:'3px 0 0',fontSize:'13px',color:'#4b5563' }}>
                        {agroPlan.layout_plan.description}
                      </p>
                    </div>
                    <div style={{ marginLeft:'auto',display:'flex',gap:'10px',flexWrap:'wrap' }}>
                      {agroPlan.layout_plan.tree_spacing && <Tag label={`🌳 Tree: ${agroPlan.layout_plan.tree_spacing}`} color="#15803d" bg="#dcfce7" />}
                      {agroPlan.layout_plan.crop_spacing && <Tag label={`🌾 Crop: ${agroPlan.layout_plan.crop_spacing}`} color="#1d4ed8" bg="#dbeafe" />}
                    </div>
                  </div>
                )}

                {/* Trees */}
                <SectionCard icon="🌳" title={t('trees') || 'Trees'} subtitle="Recommended tree species for your farm" accent="#15803d">
                  <div style={{ display:'flex',flexDirection:'column',gap:'10px' }}>
                    {(agroPlan?.recommended_agroforestry_system?.trees || []).map((tree, i) => (
                      <div key={i} style={{
                        padding:'14px 16px',borderRadius:'12px',
                        background:'rgba(21,128,61,0.06)',
                        border:'1.5px solid rgba(21,128,61,0.12)',
                        display:'flex',alignItems:'flex-start',gap:'12px',flexWrap:'wrap',
                      }}>
                        <div style={{ flex:1,minWidth:'120px' }}>
                          <span style={{ fontSize:'15px',fontWeight:'700',color:'#14532d' }}>{tree?.name || 'N/A'}</span>
                          <p style={{ margin:'4px 0 0',fontSize:'12px',color:'#6b7280' }}>{tree?.benefit || ''}</p>
                        </div>
                        <div style={{ display:'flex',gap:'8px',flexWrap:'wrap' }}>
                          {tree?.spacing_m && <Tag label={`${tree.spacing_m}m spacing`} color="#15803d" bg="#dcfce7" />}
                          {tree?.maturity_years && <Tag label={`${tree.maturity_years}yr maturity`} color="#0369a1" bg="#dbeafe" />}
                          {tree?.yield_kg_per_tree && <Tag label={`${tree.yield_kg_per_tree} kg/tree`} color="#7c3aed" bg="#ede9fe" />}
                        </div>
                      </div>
                    ))}
                    {!agroPlan?.recommended_agroforestry_system?.trees?.length && <p style={{ fontSize:'13px',color:'#9ca3af',margin:0 }}>No tree data available.</p>}
                  </div>
                </SectionCard>

                {/* Main Crops */}
                <SectionCard icon="🌾" title={t('mainCrops') || 'Main Crops'} subtitle="Primary crops recommended for your farm" accent="#1d4ed8">
                  <div style={{ display:'flex',flexDirection:'column',gap:'8px' }}>
                    {(agroPlan?.recommended_agroforestry_system?.main_crops || []).map((crop, i) => (
                      <div key={i} style={{
                        padding:'12px 16px',borderRadius:'12px',
                        background:'rgba(29,78,216,0.05)',border:'1.5px solid rgba(29,78,216,0.1)',
                        display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap',
                      }}>
                        <span style={{ fontSize:'14px',fontWeight:'700',color:'#1e40af',flex:1,minWidth:'100px' }}>{crop?.name || 'N/A'}</span>
                        <div style={{ display:'flex',gap:'8px',flexWrap:'wrap' }}>
                          {crop?.planting_density && <Tag label={crop.planting_density} color="#1d4ed8" bg="#dbeafe" />}
                          {crop?.spacing && <Tag label={crop.spacing} color="#0369a1" bg="#e0f2fe" />}
                        </div>
                      </div>
                    ))}
                    {!agroPlan?.recommended_agroforestry_system?.main_crops?.length && <p style={{ fontSize:'13px',color:'#9ca3af',margin:0 }}>No crop data available.</p>}
                  </div>
                </SectionCard>

                {/* Intercrops + Herbs side by side */}
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px' }}>
                  <SectionCard icon="🌿" title={t('intercrops') || 'Intercrops'} accent="#7c3aed">
                    <div style={{ display:'flex',flexDirection:'column',gap:'8px' }}>
                      {(agroPlan?.recommended_agroforestry_system?.intercrops || []).map((crop, i) => (
                        <div key={i} style={{ padding:'10px 14px',borderRadius:'10px',background:'rgba(124,58,237,0.05)',border:'1.5px solid rgba(124,58,237,0.1)' }}>
                          <span style={{ fontSize:'14px',fontWeight:'700',color:'#6d28d9' }}>{crop?.name || 'N/A'}</span>
                          {crop?.planting_density && <p style={{ margin:'3px 0 0',fontSize:'12px',color:'#6b7280' }}>{crop.planting_density}</p>}
                          {crop?.benefit && <p style={{ margin:'3px 0 0',fontSize:'12px',color:'#7c3aed' }}>{crop.benefit}</p>}
                        </div>
                      ))}
                      {!agroPlan?.recommended_agroforestry_system?.intercrops?.length && <p style={{ fontSize:'13px',color:'#9ca3af',margin:0 }}>No data.</p>}
                    </div>
                  </SectionCard>

                  <SectionCard icon="🌺" title={t('herbs') || 'Herbs'} accent="#c2410c">
                    <div style={{ display:'flex',flexDirection:'column',gap:'8px' }}>
                      {(agroPlan?.recommended_agroforestry_system?.herbs || []).map((herb, i) => (
                        <div key={i} style={{ padding:'10px 14px',borderRadius:'10px',background:'rgba(194,65,12,0.05)',border:'1.5px solid rgba(194,65,12,0.1)' }}>
                          <span style={{ fontSize:'14px',fontWeight:'700',color:'#c2410c' }}>{herb?.name || 'N/A'}</span>
                          {herb?.planting_density && <p style={{ margin:'3px 0 0',fontSize:'12px',color:'#6b7280' }}>{herb.planting_density}</p>}
                          {herb?.benefit && <p style={{ margin:'3px 0 0',fontSize:'12px',color:'#c2410c' }}>{herb.benefit}</p>}
                        </div>
                      ))}
                      {!agroPlan?.recommended_agroforestry_system?.herbs?.length && <p style={{ fontSize:'13px',color:'#9ca3af',margin:0 }}>No data.</p>}
                    </div>
                  </SectionCard>
                </div>
              </>
            )}

            {/* ── ECONOMICS TAB ── */}
            {activeSection === 'economics' && (
              <>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'14px' }}>
                  <StatCard label="Est. Investment" value={agroPlan?.economic_projection?.estimated_investment?.toLocaleString() ?? '—'} prefix="₹" bg="#f0fdf4" color="#15803d" />
                  <StatCard label="Expected Income" value={agroPlan?.economic_projection?.expected_income?.toLocaleString() ?? '—'} prefix="₹" bg="#eff6ff" color="#1d4ed8" />
                  <StatCard label="ROI" value={agroPlan?.economic_projection?.roi ?? '—'} bg="#faf5ff" color="#7c3aed" />
                  <StatCard label="Payback Period" value={agroPlan?.economic_projection?.payback_period_months ?? '—'} suffix=" mo" bg="#fefce8" color="#ca8a04" />
                </div>

                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px' }}>
                  <SectionCard icon="🌾" title={t('cropIncome') || 'Crop Income'} accent="#15803d">
                    <ul style={{ margin:0,padding:0,listStyle:'none',display:'flex',flexDirection:'column',gap:'0' }}>
                      {agroPlan?.economic_projection?.crop_income
                        ? Object.entries(agroPlan.economic_projection.crop_income).map(([crop, income]) => (
                            <MetricRow key={crop} label={crop} value={`₹${income?.toLocaleString() || 'N/A'}`} accent="#15803d" />
                          ))
                        : <li style={{ fontSize:'13px',color:'#9ca3af' }}>No data available.</li>}
                    </ul>
                  </SectionCard>

                  <SectionCard icon="🌳" title={t('treeIncome') || 'Tree Income'} accent="#0369a1">
                    <ul style={{ margin:0,padding:0,listStyle:'none',display:'flex',flexDirection:'column',gap:'0' }}>
                      {agroPlan?.economic_projection?.tree_income
                        ? Object.entries(agroPlan.economic_projection.tree_income).map(([tree, income]) => (
                            <MetricRow key={tree} label={tree} value={`₹${income?.toLocaleString() || 'N/A'}`} accent="#0369a1" />
                          ))
                        : <li style={{ fontSize:'13px',color:'#9ca3af' }}>No data available.</li>}
                    </ul>
                  </SectionCard>
                </div>
              </>
            )}

            {/* ── SUSTAINABILITY TAB ── */}
            {activeSection === 'sustainability' && (
              <SectionCard icon="♻️" title={t('sustainabilityMetrics') || 'Sustainability Metrics'} subtitle="Environmental impact of your agroforestry plan" accent="#059669">
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px' }}>
                  {[
                    { label: t('soilHealthIncrease') || 'Soil Health Increase', value: agroPlan?.sustainability_metrics?.soil_health_increase, icon: '🌱', color: '#15803d', bg: '#dcfce7' },
                    { label: t('waterSavings') || 'Water Savings', value: agroPlan?.sustainability_metrics?.water_savings, icon: '💧', color: '#0369a1', bg: '#dbeafe' },
                    { label: t('carbonSequestration') || 'Carbon Sequestration', value: agroPlan?.sustainability_metrics?.carbon_sequestration_potential, icon: '🌍', color: '#7c3aed', bg: '#ede9fe' },
                    { label: t('biodiversityScore') || 'Biodiversity Score', value: agroPlan?.sustainability_metrics?.biodiversity_score, icon: '🦋', color: '#d97706', bg: '#fef3c7' },
                    { label: t('climateResilience') || 'Climate Resilience', value: agroPlan?.sustainability_metrics?.climate_resilience, icon: '☀️', color: '#dc2626', bg: '#fee2e2' },
                  ].map(metric => (
                    <div key={metric.label} style={{
                      padding:'16px',borderRadius:'14px',
                      background: metric.bg,
                      border:`1.5px solid ${metric.color}22`,
                      display:'flex',alignItems:'flex-start',gap:'10px',
                    }}>
                      <span style={{ fontSize:'22px',lineHeight:1 }}>{metric.icon}</span>
                      <div>
                        <p style={{ margin:0,fontSize:'11px',fontWeight:'600',color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.05em' }}>{metric.label}</p>
                        <p style={{ margin:'4px 0 0',fontSize:'16px',fontWeight:'800',color: metric.color }}>{metric.value || 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* ── NEXT STEPS TAB ── */}
            {activeSection === 'nextsteps' && (
              <SectionCard icon="✅" title={t('nextSteps') || 'Next Steps'} subtitle="Follow these steps to implement your plan" accent="#15803d">
                <ol style={{ margin:0,padding:0,listStyle:'none',display:'flex',flexDirection:'column',gap:'12px' }}>
                  {(agroPlan?.next_steps || []).map((step, i) => (
                    <li key={i} style={{
                      display:'flex',alignItems:'flex-start',gap:'14px',
                      padding:'14px 16px',borderRadius:'12px',
                      background:'rgba(21,128,61,0.05)',
                      border:'1.5px solid rgba(21,128,61,0.1)',
                    }}>
                      <div style={{
                        width:'28px',height:'28px',borderRadius:'50%',flexShrink:0,
                        background:'linear-gradient(135deg,#15803d,#16a34a)',
                        color:'#fff',fontSize:'13px',fontWeight:'800',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        boxShadow:'0 2px 6px rgba(21,128,61,0.35)',
                      }}>{i + 1}</div>
                      <span style={{ fontSize:'14px',color:'#374151',lineHeight:'1.6',marginTop:'3px' }}>{step}</span>
                    </li>
                  ))}
                  {!agroPlan?.next_steps?.length && <li style={{ fontSize:'13px',color:'#9ca3af' }}>No steps available.</li>}
                </ol>
              </SectionCard>
            )}

            {/* Bottom actions */}
            <div style={{ display:'flex',gap:'10px',flexWrap:'wrap',paddingTop:'4px' }}>
              <button
                onClick={resetForm}
                style={{
                  padding:'12px 24px',
                  background:'linear-gradient(135deg,#14532d,#15803d)',
                  color:'#fff',border:'none',borderRadius:'12px',
                  fontSize:'14px',fontWeight:'700',cursor:'pointer',
                  boxShadow:'0 4px 14px rgba(20,83,45,0.4)',
                  transition:'all 0.2s ease',
                  display:'flex',alignItems:'center',gap:'8px',
                }}
                onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(20,83,45,0.5)'; }}
                onMouseLeave={e=>{ e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 4px 14px rgba(20,83,45,0.4)'; }}
              >
                ＋ {t('generateNewPlan') || 'Generate New Plan'}
              </button>
              <button
                onClick={() => window.print()}
                style={{
                  padding:'12px 24px',
                  background:'rgba(255,255,255,0.7)',
                  color:'#374151',
                  border:'1.5px solid rgba(0,0,0,0.1)',
                  borderRadius:'12px',fontSize:'14px',fontWeight:'600',cursor:'pointer',
                  backdropFilter:'blur(6px)',
                  display:'flex',alignItems:'center',gap:'8px',
                  transition:'all 0.2s ease',
                }}
                onMouseEnter={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.95)'; }}
                onMouseLeave={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.7)'; }}
              >
                🖨 {t('printPlan') || 'Print Plan'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default AIPlanner;
