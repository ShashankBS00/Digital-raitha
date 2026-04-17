import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
} from 'framer-motion';
import { auth } from '../firebase';
import planStorageService from '../services/planStorageService';
import FarmerInputForm from './FarmerInputForm';

/* ─── Helpers ───────────────────────────────────────────────────── */

const formatDate = (date) => date.toISOString().split('T')[0];

const average = (values) => {
  if (!values.length) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
};

/* ─── Animation Variants ────────────────────────────────────────── */

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -16 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
};

const popIn = {
  initial: { opacity: 0, scale: 0.85 },
  animate: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 340, damping: 22 } },
};

const tabSlide = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 26 } },
  exit:    { opacity: 0, x: -20, transition: { duration: 0.18 } },
};

/* ─── SectionCard (animated) ─────────────────────────────────────── */

const SectionCard = ({ icon, title, subtitle, children, accent = '#15803d', delay = 0 }) => (
  <motion.div
    variants={staggerItem}
    initial="initial"
    animate="animate"
    transition={{ delay }}
    style={{
      background: 'rgba(255,255,255,0.72)',
      borderRadius: '20px',
      padding: '24px',
      border: `1.5px solid ${accent}22`,
      backdropFilter: 'blur(14px)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      position: 'relative',
      overflow: 'hidden',
    }}
    whileHover={{
      y: -3,
      boxShadow: `0 12px 36px ${accent}22, 0 4px 14px rgba(0,0,0,0.08)`,
      borderColor: `${accent}55`,
      transition: { duration: 0.25 },
    }}
  >
    {/* subtle inner glow */}
    <div style={{
      position: 'absolute', top: 0, right: 0, width: '140px', height: '140px',
      background: `radial-gradient(circle at top right, ${accent}10, transparent 70%)`,
      pointerEvents: 'none',
    }} />

    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
      <motion.div
        style={{
          width: '42px', height: '42px', borderRadius: '13px',
          background: `linear-gradient(135deg, ${accent}, ${accent}bb)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '19px', flexShrink: 0,
          boxShadow: `0 4px 12px ${accent}40`,
        }}
        whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.4 } }}
      >
        {icon}
      </motion.div>
      <div>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#14532d', letterSpacing: '-0.01em' }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{subtitle}</p>
        )}
      </div>
    </div>
    {children}
  </motion.div>
);

/* ─── StatCard (animated hover + pop) ───────────────────────────── */

const StatCard = ({ label, value, bg = '#f0fdf4', color = '#15803d', prefix = '', suffix = '' }) => (
  <motion.div
    variants={popIn}
    initial="initial"
    animate="animate"
    whileHover={{
      scale: 1.05,
      y: -4,
      boxShadow: `0 10px 28px ${color}30`,
      transition: { type: 'spring', stiffness: 380, damping: 18 },
    }}
    whileTap={{ scale: 0.97 }}
    style={{
      background: bg,
      borderRadius: '16px',
      padding: '18px 14px',
      textAlign: 'center',
      border: `1.5px solid ${color}22`,
      cursor: 'default',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <div style={{
      position: 'absolute', bottom: 0, right: 0, width: '60px', height: '60px',
      background: `radial-gradient(circle, ${color}18, transparent 70%)`,
    }} />
    <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {label}
    </p>
    <p style={{ margin: 0, fontSize: '22px', fontWeight: '800', color, letterSpacing: '-0.02em' }}>
      {prefix}{value}{suffix}
    </p>
  </motion.div>
);

/* ─── Tag ────────────────────────────────────────────────────────── */

const Tag = ({ label, color = '#15803d', bg = '#f0fdf4' }) => (
  <motion.span
    whileHover={{ scale: 1.08 }}
    style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '4px 12px', borderRadius: '20px',
      background: bg, color, fontSize: '12px', fontWeight: '600',
      border: `1px solid ${color}30`,
      cursor: 'default',
    }}
  >
    {label}
  </motion.span>
);

/* ─── MetricRow ──────────────────────────────────────────────────── */

const MetricRow = ({ label, value, accent = '#6b7280' }) => (
  <motion.div
    variants={staggerItem}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: '1px solid rgba(0,0,0,0.05)',
    }}
  >
    <span style={{ fontSize: '13px', color: '#4b5563' }}>{label}</span>
    <span style={{ fontSize: '13px', fontWeight: '700', color: accent }}>{value || 'N/A'}</span>
  </motion.div>
);

/* ─── AnimatedButton ─────────────────────────────────────────────── */

const AnimatedButton = ({ onClick, children, variant = 'primary', style: extraStyle = {} }) => {
  const isPrimary = variant === 'primary';
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04, y: -2, boxShadow: isPrimary ? '0 8px 28px rgba(20,83,45,0.55)' : '0 4px 16px rgba(0,0,0,0.1)' }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 340, damping: 18 }}
      style={{
        padding: '12px 26px',
        background: isPrimary ? 'linear-gradient(135deg,#14532d,#16a34a)' : 'rgba(255,255,255,0.75)',
        color: isPrimary ? '#fff' : '#374151',
        border: isPrimary ? 'none' : '1.5px solid rgba(0,0,0,0.1)',
        borderRadius: '13px',
        fontSize: '14px', fontWeight: '700', cursor: 'pointer',
        boxShadow: isPrimary ? '0 4px 14px rgba(20,83,45,0.4)' : 'none',
        backdropFilter: isPrimary ? 'none' : 'blur(8px)',
        display: 'flex', alignItems: 'center', gap: '8px',
        fontFamily: 'inherit',
        ...extraStyle,
      }}
    >
      {children}
    </motion.button>
  );
};

/* ─── AI Panel Glow ──────────────────────────────────────────────── */

const GlowOrb = ({ style }) => (
  <motion.div
    animate={{
      scale: [1, 1.15, 1],
      opacity: [0.18, 0.34, 0.18],
    }}
    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    style={{
      position: 'absolute',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(74,222,128,0.5) 0%, transparent 70%)',
      pointerEvents: 'none',
      ...style,
    }}
  />
);

/* ─── Spinner ────────────────────────────────────────────────────── */

const Spinner = () => (
  <motion.svg
    animate={{ rotate: 360 }}
    transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
    style={{ width: '14px', height: '14px' }}
    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
  >
    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </motion.svg>
);

/* ─── Main Component ─────────────────────────────────────────────── */

const SECTIONS = [
  { id: 'overview',      label: 'Overview',      icon: '📊' },
  { id: 'crops',         label: 'Crops & Trees',  icon: '🌳' },
  { id: 'economics',     label: 'Economics',      icon: '💰' },
  { id: 'sustainability',label: 'Sustainability', icon: '♻️' },
  { id: 'nextsteps',     label: 'Next Steps',     icon: '✅' },
];

const AIPlanner = ({ onLocationChange }) => {
  const { t } = useTranslation();
  const [agroPlan,       setAgroPlan]       = useState(null);
  const [planInputs,     setPlanInputs]     = useState(null);
  const [locationName,   setLocationName]   = useState('');
  const [locationLoading,setLocationLoading]= useState(false);
  const [locationError,  setLocationError]  = useState('');
  const [climateData,    setClimateData]    = useState(null);
  const [climateLoading, setClimateLoading] = useState(false);
  const [climateError,   setClimateError]   = useState('');
  const [saveStatus,     setSaveStatus]     = useState('');
  const [planLoaded,     setPlanLoaded]     = useState(false);
  const [activeSection,  setActiveSection]  = useState('overview');

  /* ── Load saved plan ── */
  useEffect(() => {
    (async () => {
      const user = auth.currentUser;
      if (!user) { setPlanLoaded(true); return; }
      try {
        const saved = await planStorageService.getLatestPlan(user.uid);
        if (saved?.plan) {
          setAgroPlan(saved.plan);
          setPlanInputs(saved.inputs || null);
        }
      } catch (err) {
        console.error('Error loading saved plan:', err);
      } finally {
        setPlanLoaded(true);
      }
    })();
  }, []);

  /* ── Handle plan generated ── */
  const handlePlanGenerated = async (plan, inputs) => {
    setAgroPlan(plan);
    setPlanInputs(inputs);
    setActiveSection('overview');
    if (onLocationChange && inputs?.latitude && inputs?.longitude) {
      onLocationChange({ lat: inputs.latitude, lng: inputs.longitude });
    }
    const userId = auth.currentUser?.uid ?? null;
    setSaveStatus('saving');
    try {
      await planStorageService.savePlan(userId, plan, inputs);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      console.error('Error saving plan:', err);
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

  /* ── Fetch location + climate ── */
  useEffect(() => {
    const lat = Number(agroPlan?.farm_location?.latitude ?? planInputs?.latitude);
    const lng = Number(agroPlan?.farm_location?.longitude ?? planInputs?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    let cancelled = false;
    (async () => {
      setLocationLoading(true); setClimateLoading(true);
      setLocationError('');     setClimateError('');
      const end   = new Date();
      const start = new Date(end);
      start.setDate(end.getDate() - 364);
      const [locR, climR] = await Promise.allSettled([
        axios.get('https://nominatim.openstreetmap.org/reverse', {
          params: { format: 'jsonv2', lat, lon: lng, 'accept-language': 'en' },
        }),
        axios.get('https://archive-api.open-meteo.com/v1/archive', {
          params: {
            latitude: lat, longitude: lng,
            start_date: formatDate(start), end_date: formatDate(end),
            daily: 'temperature_2m_mean,precipitation_sum,shortwave_radiation_sum',
            timezone: 'auto',
          },
        }),
      ]);
      if (!cancelled) {
        if (locR.status === 'fulfilled') {
          const addr = locR.value.data?.address || {};
          const city = addr.city || addr.town || addr.village || addr.municipality || addr.county;
          setLocationName(city && addr.country ? `${city}, ${addr.country}` : addr.country || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } else {
          setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          setLocationError('Unable to resolve location name');
        }
        setLocationLoading(false);
        if (climR.status === 'fulfilled') {
          const daily = climR.value.data?.daily || {};
          const temps   = (daily.temperature_2m_mean   || []).filter(Number.isFinite);
          const precips = (daily.precipitation_sum      || []).filter(Number.isFinite);
          const solars  = (daily.shortwave_radiation_sum|| []).filter(Number.isFinite);
          const days    = Math.max(temps.length, precips.length, solars.length);
          if (days > 0) {
            const avgSolarMj  = average(solars);
            const totalRain   = precips.reduce((s, v) => s + v, 0);
            setClimateData({
              avg_rainfall_mm:           Math.round(totalRain * (365 / days)),
              avg_temperature_c:         average(temps) !== null ? Number(average(temps).toFixed(1)) : null,
              solar_radiation_kwh_m2_day:avgSolarMj !== null ? Number((avgSolarMj / 3.6).toFixed(1)) : null,
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
    })();
    return () => { cancelled = true; };
  }, [agroPlan, planInputs]);

  /* ── Derived display values ── */
  const displayedRainfall    = climateData?.avg_rainfall_mm     ?? agroPlan?.climate_summary?.avg_rainfall_mm    ?? null;
  const displayedTemperature = climateData?.avg_temperature_c   ?? agroPlan?.climate_summary?.avg_temperature_c  ?? null;
  const displayedSolar       = climateData?.solar_radiation_kwh_m2_day != null
    ? `${climateData.solar_radiation_kwh_m2_day} kWh/m²/day`
    : (agroPlan?.climate_summary?.solar_radiation || null);
  const farmLat = Number(agroPlan?.farm_location?.latitude);
  const farmLng = Number(agroPlan?.farm_location?.longitude);
  const displayedLatitude  = Number.isFinite(farmLat) ? farmLat.toFixed(6) : 'N/A';
  const displayedLongitude = Number.isFinite(farmLng) ? farmLng.toFixed(6) : 'N/A';

  const capacityBadge = {
    low:    { label: 'Low (< ₹50K)',    color: '#d97706', bg: '#fef3c7' },
    medium: { label: 'Medium (₹50K–1L)', color: '#2563eb', bg: '#dbeafe' },
    high:   { label: 'High (> ₹1L)',    color: '#15803d', bg: '#dcfce7' },
  };
  const cap = capacityBadge[planInputs?.investment_capacity] || { label: 'N/A', color: '#6b7280', bg: '#f3f4f6' };

  /* ─────────────────────────── RENDER ─────────────────────────── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        fontFamily: "'Inter','Segoe UI',sans-serif",
        background: 'linear-gradient(135deg,#f0fdf4 0%,#dcfce7 40%,#d1fae5 100%)',
        borderRadius: '26px',
        overflow: 'hidden',
        boxShadow: '0 8px 48px rgba(16,185,129,0.14),0 2px 8px rgba(0,0,0,0.06)',
      }}
    >

      {/* ══════════════════════ HEADER BANNER ══════════════════════ */}
      <div style={{
        background: 'linear-gradient(135deg,#14532d 0%,#166534 55%,#15803d 100%)',
        padding: '30px 34px 26px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Glow orbs */}
        <GlowOrb style={{ width: '200px', height: '200px', top: '-80px', right: '-60px' }} />
        <GlowOrb style={{ width: '120px', height: '120px', bottom: '-50px', right: '120px', animationDelay: '1.5s' }} />
        <div style={{ position:'absolute',top:'-40px',right:'-40px',width:'160px',height:'160px',borderRadius:'50%',background:'rgba(255,255,255,0.04)' }} />

        {/* Title row */}
        <div style={{ position:'relative',zIndex:1,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'12px' }}>
          <div style={{ display:'flex',alignItems:'center',gap:'16px' }}>
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width:'52px',height:'52px',borderRadius:'18px',
                background:'rgba(255,255,255,0.16)',backdropFilter:'blur(12px)',
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:'26px',
                border:'1.5px solid rgba(255,255,255,0.22)',
              }}
            >🌱</motion.div>
            <div>
              <motion.h2
                initial={{ opacity:0, x:-20 }}
                animate={{ opacity:1, x:0 }}
                transition={{ delay:0.15 }}
                style={{ margin:0,color:'#fff',fontSize:'22px',fontWeight:'800',letterSpacing:'-0.02em' }}
              >
                {t('aiDrivenAgroforestryPlanner') || 'AI-Driven Agroforestry Planner'}
              </motion.h2>
              <motion.p
                initial={{ opacity:0 }}
                animate={{ opacity:1 }}
                transition={{ delay:0.25 }}
                style={{ margin:0,color:'rgba(255,255,255,0.65)',fontSize:'13px',marginTop:'3px' }}
              >
                {agroPlan
                  ? (locationLoading ? 'Resolving location…' : `📍 ${locationName || 'Location ready'}`)
                  : '🌾 Enter your farm details to receive a personalized agroforestry plan'}
              </motion.p>
            </div>
          </div>

          <AnimatePresence>
            {agroPlan && (
              <motion.div
                initial={{ opacity:0, scale:0.8 }}
                animate={{ opacity:1, scale:1 }}
                exit={{ opacity:0, scale:0.8 }}
              >
                <AnimatedButton onClick={resetForm} variant="ghost" style={{
                  background:'rgba(255,255,255,0.15)',color:'#fff',
                  border:'1.5px solid rgba(255,255,255,0.25)',
                  backdropFilter:'blur(8px)',
                }}>
                  ＋ {t('generateNewPlan') || 'New Plan'}
                </AnimatedButton>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Save status pill */}
        <AnimatePresence>
          {saveStatus && (
            <motion.div
              initial={{ opacity:0, y:8 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-8 }}
              style={{
                position:'relative',zIndex:1,marginTop:'14px',
                display:'inline-flex',alignItems:'center',gap:'8px',
                padding:'7px 16px',borderRadius:'20px',fontSize:'13px',fontWeight:'600',
                background: saveStatus==='saving'?'rgba(59,130,246,0.25)':saveStatus==='saved'?'rgba(34,197,94,0.25)':'rgba(239,68,68,0.25)',
                color: saveStatus==='saving'?'#bfdbfe':saveStatus==='saved'?'#bbf7d0':'#fecaca',
                border:'1px solid currentColor',
              }}
            >
              {saveStatus==='saving' && <Spinner />}
              {saveStatus==='saving' && (t('savingPlan') || 'Saving plan to cloud…')}
              {saveStatus==='saved'  && '✓ ' + (t('planSaved') || 'Plan saved!')}
              {saveStatus==='error'  && '⚠ ' + (t('planSaveError') || 'Could not save — plan available locally.')}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Sidebar / Tabs (animated) ── */}
        <AnimatePresence>
          {agroPlan && (
            <motion.div
              initial={{ opacity:0, y:14 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:8 }}
              transition={{ delay:0.1 }}
              style={{ position:'relative',zIndex:1,display:'flex',gap:'6px',marginTop:'22px',overflowX:'auto',paddingBottom:'2px' }}
            >
              {SECTIONS.map((s, idx) => {
                const isActive = activeSection === s.id;
                return (
                  <motion.button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    initial={{ opacity:0, y:10 }}
                    animate={{ opacity:1, y:0 }}
                    transition={{ delay: 0.12 + idx * 0.06 }}
                    whileHover={{ scale:1.06, backgroundColor:'rgba(255,255,255,0.22)' }}
                    whileTap={{ scale:0.95 }}
                    style={{
                      padding:'9px 16px',borderRadius:'12px',border:'none',cursor:'pointer',
                      whiteSpace:'nowrap',
                      background: isActive ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.07)',
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                      fontSize:'12px',fontWeight: isActive ? '700' : '500',
                      backdropFilter:'blur(6px)',outline:'none',
                      display:'flex',alignItems:'center',gap:'6px',
                      fontFamily:'inherit',
                      position:'relative',
                    }}
                  >
                    {s.icon} {s.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        style={{ position:'absolute',bottom:'6px',left:'50%',transform:'translateX(-50%)',width:'20px',height:'3px',background:'#4ade80',borderRadius:'3px' }}
                        transition={{ type:'spring', stiffness:380, damping:26 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══════════════════════ BODY ══════════════════════ */}
      <div style={{ padding:'26px' }}>

        {/* ── NO PLAN: input form ── */}
        <AnimatePresence mode="wait">
          {!agroPlan && (
            <motion.div
              key="form"
              initial={{ opacity:0, y:24 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-24 }}
              transition={{ duration:0.35 }}
              style={{
                background:'rgba(255,255,255,0.65)',
                borderRadius:'20px',
                padding:'24px',
                border:'1.5px solid rgba(16,185,129,0.15)',
                backdropFilter:'blur(12px)',
                boxShadow:'0 4px 18px rgba(0,0,0,0.05)',
              }}
            >
              <FarmerInputForm onPlanGenerated={handlePlanGenerated} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── PLAN AVAILABLE ── */}
        <AnimatePresence mode="wait">
          {agroPlan && (
            <motion.div
              key="plan"
              initial={{ opacity:0 }}
              animate={{ opacity:1 }}
              exit={{ opacity:0 }}
              style={{ display:'flex', flexDirection:'column', gap:'20px' }}
            >

              {/* ── Page transition wrapper for each section ── */}
              <AnimatePresence mode="wait">

                {/* ════════════ OVERVIEW ════════════ */}
                {activeSection === 'overview' && (
                  <motion.div key="overview" variants={tabSlide} initial="initial" animate="animate" exit="exit">
                    <motion.div
                      variants={staggerContainer}
                      initial="initial"
                      animate="animate"
                      style={{ display:'flex', flexDirection:'column', gap:'18px' }}
                    >
                      {/* Stat cards row */}
                      <motion.div
                        variants={staggerContainer}
                        style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'14px' }}
                      >
                        <StatCard label="Land Area"    value={planInputs?.land_area || '—'} suffix=" acres" bg="#f0fdf4" color="#15803d" />
                        <StatCard label="Investment"   value={cap.label}                     bg={cap.bg}    color={cap.color} />
                        <StatCard label="Avg Temp"     value={displayedTemperature !== null ? `${displayedTemperature}°C` : climateLoading ? '…' : '—'} bg="#eff6ff" color="#2563eb" />
                        <StatCard label="Annual Rain"  value={displayedRainfall    !== null ? `${displayedRainfall} mm`  : climateLoading ? '…' : '—'} bg="#f0fdf4" color="#059669" />
                        <StatCard label="Solar"        value={displayedSolar || (climateLoading ? '…' : '—')} bg="#fefce8" color="#ca8a04" />
                      </motion.div>

                      {/* Location + Soil */}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                        <SectionCard icon="📍" title={t('farmLocation') || 'Farm Location'} accent="#2563eb" delay={0}>
                          <motion.div variants={staggerContainer} initial="initial" animate="animate">
                            <MetricRow label="Location"  value={locationLoading ? 'Resolving…' : (locationName || `${displayedLatitude}, ${displayedLongitude}`)} accent="#1d4ed8" />
                            <MetricRow label="Latitude"  value={displayedLatitude} />
                            <MetricRow label="Longitude" value={displayedLongitude} />
                            <MetricRow label="Elevation" value={agroPlan?.farm_location?.elevation ? `${agroPlan.farm_location.elevation} m` : null} />
                          </motion.div>
                          {locationError && <p style={{ fontSize:'12px',color:'#b45309',marginTop:'10px' }}>⚠ {locationError}</p>}
                        </SectionCard>

                        <SectionCard icon="🌍" title={t('soilSummary') || 'Soil Summary'} accent="#92400e" delay={0.06}>
                          <motion.div variants={staggerContainer} initial="initial" animate="animate">
                            <MetricRow label="pH Level"       value={agroPlan?.soil_summary?.ph}             accent="#92400e" />
                            <MetricRow label="Organic Carbon" value={agroPlan?.soil_summary?.organic_carbon} />
                            <MetricRow label="Nitrogen"       value={agroPlan?.soil_summary?.nitrogen} />
                            <MetricRow label="Texture"        value={agroPlan?.soil_summary?.texture} />
                            <MetricRow label="Drainage"       value={agroPlan?.soil_summary?.drainage} />
                          </motion.div>
                          {agroPlan?.soil_summary?.recommendation && (
                            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}
                              style={{ marginTop:'12px',padding:'10px 14px',background:'rgba(146,64,14,0.07)',borderRadius:'10px',fontSize:'13px',color:'#78350f',lineHeight:'1.5' }}>
                              💡 {agroPlan.soil_summary.recommendation}
                            </motion.div>
                          )}
                        </SectionCard>
                      </div>

                      {/* Climate + Tips */}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                        <SectionCard icon="☀️" title={t('climateSummary') || 'Climate Summary'} accent="#d97706" delay={0.12}>
                          {climateLoading && (
                            <div style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px',fontSize:'13px',color:'#6b7280' }}>
                              <Spinner /> Fetching live climate data…
                            </div>
                          )}
                          <motion.div variants={staggerContainer} initial="initial" animate="animate">
                            <MetricRow label="Avg Rainfall"    value={displayedRainfall    !== null ? `${displayedRainfall} mm/yr`    : null} accent="#0369a1" />
                            <MetricRow label="Avg Temp"        value={displayedTemperature !== null ? `${displayedTemperature}°C`      : null} accent="#b45309" />
                            <MetricRow label="Solar Radiation" value={displayedSolar}  accent="#ca8a04" />
                          </motion.div>
                          {agroPlan?.climate_summary?.recommendation && (
                            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}
                              style={{ marginTop:'12px',padding:'10px 14px',background:'rgba(217,119,6,0.07)',borderRadius:'10px',fontSize:'13px',color:'#92400e',lineHeight:'1.5' }}>
                              💡 {agroPlan.climate_summary.recommendation}
                            </motion.div>
                          )}
                          {climateError && <p style={{ fontSize:'12px',color:'#b45309',marginTop:'10px' }}>⚠ {climateError}</p>}
                        </SectionCard>

                        <SectionCard icon="🌱" title={t('soilImprovementTips') || 'Soil Improvement Tips'} accent="#15803d" delay={0.18}>
                          <motion.ul
                            variants={staggerContainer}
                            initial="initial"
                            animate="animate"
                            style={{ margin:0,padding:0,listStyle:'none',display:'flex',flexDirection:'column',gap:'8px' }}
                          >
                            {(agroPlan?.soil_improvement_tips || []).map((tip, i) => (
                              <motion.li key={i} variants={staggerItem}
                                style={{ display:'flex',alignItems:'flex-start',gap:'8px',fontSize:'13px',color:'#374151',lineHeight:'1.5' }}>
                                <span style={{ color:'#16a34a',fontWeight:'700',flexShrink:0,marginTop:'1px' }}>✓</span>
                                {tip}
                              </motion.li>
                            ))}
                            {!agroPlan?.soil_improvement_tips?.length && (
                              <li style={{ fontSize:'13px',color:'#9ca3af' }}>No tips available.</li>
                            )}
                          </motion.ul>
                        </SectionCard>
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {/* ════════════ CROPS & TREES ════════════ */}
                {activeSection === 'crops' && (
                  <motion.div key="crops" variants={tabSlide} initial="initial" animate="animate" exit="exit">
                    <motion.div variants={staggerContainer} initial="initial" animate="animate"
                      style={{ display:'flex', flexDirection:'column', gap:'18px' }}>

                      {agroPlan?.layout_plan && (
                        <motion.div variants={staggerItem}
                          style={{
                            padding:'18px 24px',
                            background:'linear-gradient(135deg,rgba(20,83,45,0.08),rgba(22,163,74,0.12))',
                            borderRadius:'18px',border:'1.5px solid rgba(22,163,74,0.2)',
                            display:'flex',alignItems:'center',gap:'16px',flexWrap:'wrap',
                          }}>
                          <motion.span animate={{ y:[0,-4,0] }} transition={{ duration:2,repeat:Infinity }} style={{ fontSize:'26px' }}>📐</motion.span>
                          <div>
                            <p style={{ margin:0,fontSize:'15px',fontWeight:'700',color:'#14532d' }}>{agroPlan.layout_plan.pattern || 'Layout'}</p>
                            <p style={{ margin:'3px 0 0',fontSize:'13px',color:'#4b5563' }}>{agroPlan.layout_plan.description}</p>
                          </div>
                          <div style={{ marginLeft:'auto',display:'flex',gap:'10px',flexWrap:'wrap' }}>
                            {agroPlan.layout_plan.tree_spacing && <Tag label={`🌳 Tree: ${agroPlan.layout_plan.tree_spacing}`} color="#15803d" bg="#dcfce7" />}
                            {agroPlan.layout_plan.crop_spacing && <Tag label={`🌾 Crop: ${agroPlan.layout_plan.crop_spacing}`} color="#1d4ed8" bg="#dbeafe" />}
                          </div>
                        </motion.div>
                      )}

                      <SectionCard icon="🌳" title={t('trees') || 'Trees'} subtitle="Recommended tree species" accent="#15803d">
                        <motion.div variants={staggerContainer} initial="initial" animate="animate"
                          style={{ display:'flex',flexDirection:'column',gap:'10px' }}>
                          {(agroPlan?.recommended_agroforestry_system?.trees || []).map((tree, i) => (
                            <motion.div key={i} variants={staggerItem}
                              whileHover={{ x:4, backgroundColor:'rgba(21,128,61,0.1)' }}
                              style={{ padding:'14px 16px',borderRadius:'12px',background:'rgba(21,128,61,0.06)',border:'1.5px solid rgba(21,128,61,0.12)',display:'flex',alignItems:'flex-start',gap:'12px',flexWrap:'wrap' }}>
                              <div style={{ flex:1,minWidth:'120px' }}>
                                <span style={{ fontSize:'15px',fontWeight:'700',color:'#14532d' }}>{tree?.name || 'N/A'}</span>
                                <p style={{ margin:'4px 0 0',fontSize:'12px',color:'#6b7280' }}>{tree?.benefit || ''}</p>
                              </div>
                              <div style={{ display:'flex',gap:'8px',flexWrap:'wrap' }}>
                                {tree?.spacing_m     && <Tag label={`${tree.spacing_m}m spacing`}      color="#15803d" bg="#dcfce7" />}
                                {tree?.maturity_years && <Tag label={`${tree.maturity_years}yr maturity`} color="#0369a1" bg="#dbeafe" />}
                                {tree?.yield_kg_per_tree && <Tag label={`${tree.yield_kg_per_tree} kg/tree`} color="#7c3aed" bg="#ede9fe" />}
                              </div>
                            </motion.div>
                          ))}
                          {!agroPlan?.recommended_agroforestry_system?.trees?.length && <p style={{ fontSize:'13px',color:'#9ca3af',margin:0 }}>No tree data available.</p>}
                        </motion.div>
                      </SectionCard>

                      <SectionCard icon="🌾" title={t('mainCrops') || 'Main Crops'} subtitle="Primary crops recommended" accent="#1d4ed8">
                        <motion.div variants={staggerContainer} initial="initial" animate="animate"
                          style={{ display:'flex',flexDirection:'column',gap:'8px' }}>
                          {(agroPlan?.recommended_agroforestry_system?.main_crops || []).map((crop, i) => (
                            <motion.div key={i} variants={staggerItem}
                              whileHover={{ x:4 }}
                              style={{ padding:'12px 16px',borderRadius:'12px',background:'rgba(29,78,216,0.05)',border:'1.5px solid rgba(29,78,216,0.1)',display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap' }}>
                              <span style={{ fontSize:'14px',fontWeight:'700',color:'#1e40af',flex:1,minWidth:'100px' }}>{crop?.name || 'N/A'}</span>
                              <div style={{ display:'flex',gap:'8px',flexWrap:'wrap' }}>
                                {crop?.planting_density && <Tag label={crop.planting_density} color="#1d4ed8" bg="#dbeafe" />}
                                {crop?.spacing          && <Tag label={crop.spacing}           color="#0369a1" bg="#e0f2fe" />}
                              </div>
                            </motion.div>
                          ))}
                          {!agroPlan?.recommended_agroforestry_system?.main_crops?.length && <p style={{ fontSize:'13px',color:'#9ca3af',margin:0 }}>No crop data available.</p>}
                        </motion.div>
                      </SectionCard>

                      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px' }}>
                        <SectionCard icon="🌿" title={t('intercrops') || 'Intercrops'} accent="#7c3aed">
                          <motion.div variants={staggerContainer} initial="initial" animate="animate"
                            style={{ display:'flex',flexDirection:'column',gap:'8px' }}>
                            {(agroPlan?.recommended_agroforestry_system?.intercrops || []).map((crop, i) => (
                              <motion.div key={i} variants={staggerItem}
                                style={{ padding:'10px 14px',borderRadius:'10px',background:'rgba(124,58,237,0.05)',border:'1.5px solid rgba(124,58,237,0.1)' }}>
                                <span style={{ fontSize:'14px',fontWeight:'700',color:'#6d28d9' }}>{crop?.name || 'N/A'}</span>
                                {crop?.planting_density && <p style={{ margin:'3px 0 0',fontSize:'12px',color:'#6b7280' }}>{crop.planting_density}</p>}
                                {crop?.benefit          && <p style={{ margin:'3px 0 0',fontSize:'12px',color:'#7c3aed' }}>{crop.benefit}</p>}
                              </motion.div>
                            ))}
                            {!agroPlan?.recommended_agroforestry_system?.intercrops?.length && <p style={{ fontSize:'13px',color:'#9ca3af',margin:0 }}>No data.</p>}
                          </motion.div>
                        </SectionCard>

                        <SectionCard icon="🌺" title={t('herbs') || 'Herbs'} accent="#c2410c">
                          <motion.div variants={staggerContainer} initial="initial" animate="animate"
                            style={{ display:'flex',flexDirection:'column',gap:'8px' }}>
                            {(agroPlan?.recommended_agroforestry_system?.herbs || []).map((herb, i) => (
                              <motion.div key={i} variants={staggerItem}
                                style={{ padding:'10px 14px',borderRadius:'10px',background:'rgba(194,65,12,0.05)',border:'1.5px solid rgba(194,65,12,0.1)' }}>
                                <span style={{ fontSize:'14px',fontWeight:'700',color:'#c2410c' }}>{herb?.name || 'N/A'}</span>
                                {herb?.planting_density && <p style={{ margin:'3px 0 0',fontSize:'12px',color:'#6b7280' }}>{herb.planting_density}</p>}
                                {herb?.benefit          && <p style={{ margin:'3px 0 0',fontSize:'12px',color:'#c2410c' }}>{herb.benefit}</p>}
                              </motion.div>
                            ))}
                            {!agroPlan?.recommended_agroforestry_system?.herbs?.length && <p style={{ fontSize:'13px',color:'#9ca3af',margin:0 }}>No data.</p>}
                          </motion.div>
                        </SectionCard>
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {/* ════════════ ECONOMICS ════════════ */}
                {activeSection === 'economics' && (
                  <motion.div key="economics" variants={tabSlide} initial="initial" animate="animate" exit="exit">
                    <motion.div variants={staggerContainer} initial="initial" animate="animate"
                      style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
                      <motion.div variants={staggerContainer}
                        style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'14px' }}>
                        <StatCard label="Est. Investment" value={agroPlan?.economic_projection?.estimated_investment?.toLocaleString() ?? '—'} prefix="₹" bg="#f0fdf4" color="#15803d" />
                        <StatCard label="Expected Income"  value={agroPlan?.economic_projection?.expected_income?.toLocaleString()      ?? '—'} prefix="₹" bg="#eff6ff" color="#1d4ed8" />
                        <StatCard label="ROI"              value={agroPlan?.economic_projection?.roi            ?? '—'} bg="#faf5ff" color="#7c3aed" />
                        <StatCard label="Payback Period"   value={agroPlan?.economic_projection?.payback_period_months ?? '—'} suffix=" mo" bg="#fefce8" color="#ca8a04" />
                      </motion.div>

                      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px' }}>
                        <SectionCard icon="🌾" title={t('cropIncome') || 'Crop Income'} accent="#15803d">
                          <motion.ul variants={staggerContainer} initial="initial" animate="animate"
                            style={{ margin:0,padding:0,listStyle:'none',display:'flex',flexDirection:'column',gap:'0' }}>
                            {agroPlan?.economic_projection?.crop_income
                              ? Object.entries(agroPlan.economic_projection.crop_income).map(([crop, income]) => (
                                  <MetricRow key={crop} label={crop} value={`₹${income?.toLocaleString() || 'N/A'}`} accent="#15803d" />
                                ))
                              : <li style={{ fontSize:'13px',color:'#9ca3af' }}>No data available.</li>}
                          </motion.ul>
                        </SectionCard>

                        <SectionCard icon="🌳" title={t('treeIncome') || 'Tree Income'} accent="#0369a1">
                          <motion.ul variants={staggerContainer} initial="initial" animate="animate"
                            style={{ margin:0,padding:0,listStyle:'none',display:'flex',flexDirection:'column',gap:'0' }}>
                            {agroPlan?.economic_projection?.tree_income
                              ? Object.entries(agroPlan.economic_projection.tree_income).map(([tree, income]) => (
                                  <MetricRow key={tree} label={tree} value={`₹${income?.toLocaleString() || 'N/A'}`} accent="#0369a1" />
                                ))
                              : <li style={{ fontSize:'13px',color:'#9ca3af' }}>No data available.</li>}
                          </motion.ul>
                        </SectionCard>
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {/* ════════════ SUSTAINABILITY ════════════ */}
                {activeSection === 'sustainability' && (
                  <motion.div key="sustainability" variants={tabSlide} initial="initial" animate="animate" exit="exit">
                    <SectionCard icon="♻️" title={t('sustainabilityMetrics') || 'Sustainability Metrics'}
                      subtitle="Environmental impact of your agroforestry plan" accent="#059669">
                      <motion.div variants={staggerContainer} initial="initial" animate="animate"
                        style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px' }}>
                        {[
                          { label: t('soilHealthIncrease')     || 'Soil Health Increase',        value: agroPlan?.sustainability_metrics?.soil_health_increase,          icon:'🌱', color:'#15803d', bg:'#dcfce7' },
                          { label: t('waterSavings')            || 'Water Savings',                value: agroPlan?.sustainability_metrics?.water_savings,                  icon:'💧', color:'#0369a1', bg:'#dbeafe' },
                          { label: t('carbonSequestration')     || 'Carbon Sequestration',         value: agroPlan?.sustainability_metrics?.carbon_sequestration_potential, icon:'🌍', color:'#7c3aed', bg:'#ede9fe' },
                          { label: t('biodiversityScore')       || 'Biodiversity Score',           value: agroPlan?.sustainability_metrics?.biodiversity_score,             icon:'🦋', color:'#d97706', bg:'#fef3c7' },
                          { label: t('climateResilience')       || 'Climate Resilience',           value: agroPlan?.sustainability_metrics?.climate_resilience,             icon:'☀️', color:'#dc2626', bg:'#fee2e2' },
                        ].map((metric, idx) => (
                          <motion.div key={metric.label} variants={staggerItem}
                            whileHover={{ scale:1.04, boxShadow:`0 8px 24px ${metric.color}22` }}
                            style={{ padding:'18px',borderRadius:'16px',background:metric.bg,border:`1.5px solid ${metric.color}22`,display:'flex',alignItems:'flex-start',gap:'12px' }}>
                            <motion.span animate={{ y:[0,-3,0] }} transition={{ duration:2, repeat:Infinity, delay:idx*0.4 }} style={{ fontSize:'24px',lineHeight:1 }}>{metric.icon}</motion.span>
                            <div>
                              <p style={{ margin:0,fontSize:'11px',fontWeight:'600',color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.05em' }}>{metric.label}</p>
                              <p style={{ margin:'4px 0 0',fontSize:'18px',fontWeight:'800',color:metric.color }}>{metric.value || 'N/A'}</p>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </SectionCard>
                  </motion.div>
                )}

                {/* ════════════ NEXT STEPS ════════════ */}
                {activeSection === 'nextsteps' && (
                  <motion.div key="nextsteps" variants={tabSlide} initial="initial" animate="animate" exit="exit">
                    <SectionCard icon="✅" title={t('nextSteps') || 'Next Steps'} subtitle="Follow these steps to implement your plan" accent="#15803d">
                      <motion.ol variants={staggerContainer} initial="initial" animate="animate"
                        style={{ margin:0,padding:0,listStyle:'none',display:'flex',flexDirection:'column',gap:'12px' }}>
                        {(agroPlan?.next_steps || []).map((step, i) => (
                          <motion.li key={i} variants={staggerItem}
                            whileHover={{ x:6, backgroundColor:'rgba(21,128,61,0.09)' }}
                            style={{ display:'flex',alignItems:'flex-start',gap:'14px',padding:'14px 16px',borderRadius:'13px',background:'rgba(21,128,61,0.05)',border:'1.5px solid rgba(21,128,61,0.1)',transition:'background 0.2s' }}>
                            <motion.div
                              initial={{ scale:0 }}
                              animate={{ scale:1 }}
                              transition={{ type:'spring', stiffness:320, damping:18, delay: i * 0.08 }}
                              style={{ width:'30px',height:'30px',borderRadius:'50%',flexShrink:0,background:'linear-gradient(135deg,#15803d,#16a34a)',color:'#fff',fontSize:'13px',fontWeight:'800',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 3px 10px rgba(21,128,61,0.4)' }}>
                              {i + 1}
                            </motion.div>
                            <span style={{ fontSize:'14px',color:'#374151',lineHeight:'1.6',marginTop:'4px' }}>{step}</span>
                          </motion.li>
                        ))}
                        {!agroPlan?.next_steps?.length && (
                          <li style={{ fontSize:'13px',color:'#9ca3af' }}>No steps available.</li>
                        )}
                      </motion.ol>
                    </SectionCard>
                  </motion.div>
                )}

              </AnimatePresence>

              {/* ── Bottom action buttons ── */}
              <motion.div
                initial={{ opacity:0, y:16 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay:0.3 }}
                style={{ display:'flex', gap:'12px', flexWrap:'wrap', paddingTop:'4px' }}
              >
                <AnimatedButton onClick={resetForm} variant="primary">
                  ＋ {t('generateNewPlan') || 'Generate New Plan'}
                </AnimatedButton>
                <AnimatedButton onClick={() => window.print()} variant="ghost">
                  🖨 {t('printPlan') || 'Print Plan'}
                </AnimatedButton>
              </motion.div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default AIPlanner;
