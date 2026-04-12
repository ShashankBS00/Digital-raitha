import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

/* ── Inject Inter font once ─────────────────────────────────── */
const FONT_ID = 'weather-inter-font';
if (typeof document !== 'undefined' && !document.getElementById(FONT_ID)) {
  const link = document.createElement('link');
  link.id = FONT_ID;
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
  document.head.appendChild(link);
}

/* ── Weather condition → icon + gradient ────────────────────── */
const getWeatherTheme = (description, temp) => {
  const d = (description || '').toLowerCase();
  if (d.includes('clear') || d.includes('sunny'))
    return { icon: '☀️', grad: 'linear-gradient(135deg,#f59e0b,#fbbf24,#fde68a)', accent: '#b45309', sky: 'linear-gradient(160deg,#0c3e6e 0%,#1a5fa0 50%,#2d7dd2 100%)' };
  if (d.includes('cloud'))
    return { icon: '⛅', grad: 'linear-gradient(135deg,#64748b,#94a3b8,#cbd5e1)', accent: '#475569', sky: 'linear-gradient(160deg,#1e2a3a 0%,#2d3f55 50%,#3d5468 100%)' };
  if (d.includes('rain') || d.includes('drizzle'))
    return { icon: '🌧️', grad: 'linear-gradient(135deg,#2563eb,#3b82f6,#93c5fd)', accent: '#1d4ed8', sky: 'linear-gradient(160deg,#0f172a 0%,#1e3a5f 50%,#1e40af 100%)' };
  if (d.includes('thunder') || d.includes('storm'))
    return { icon: '⛈️', grad: 'linear-gradient(135deg,#4c1d95,#7c3aed,#a78bfa)', accent: '#5b21b6', sky: 'linear-gradient(160deg,#0d0d1a 0%,#1a1040 50%,#2d1b69 100%)' };
  if (d.includes('snow'))
    return { icon: '❄️', grad: 'linear-gradient(135deg,#0ea5e9,#7dd3fc,#e0f2fe)', accent: '#0284c7', sky: 'linear-gradient(160deg,#0c2a3e 0%,#164e63 50%,#0e7490 100%)' };
  if (d.includes('mist') || d.includes('fog') || d.includes('haze'))
    return { icon: '🌫️', grad: 'linear-gradient(135deg,#6b7280,#9ca3af,#d1d5db)', accent: '#4b5563', sky: 'linear-gradient(160deg,#1a1f2e 0%,#2a3040 50%,#3a4050 100%)' };
  // default by temp
  if (temp != null && temp > 35)
    return { icon: '🌡️', grad: 'linear-gradient(135deg,#dc2626,#f97316,#fbbf24)', accent: '#b91c1c', sky: 'linear-gradient(160deg,#1a0a00 0%,#3d1a00 50%,#7c2d12 100%)' };
  return { icon: '🌤️', grad: 'linear-gradient(135deg,#0ea5e9,#38bdf8,#7dd3fc)', accent: '#0369a1', sky: 'linear-gradient(160deg,#0c1e30 0%,#0f3460 50%,#1a5fa0 100%)' };
};

const getHumidityLabel = (h) =>
  h == null ? '' : h < 30 ? 'Dry' : h < 60 ? 'Comfortable' : h < 80 ? 'Humid' : 'Very Humid';
const getWindLabel = (w) =>
  w == null ? '' : w < 2 ? 'Calm' : w < 6 ? 'Light Breeze' : w < 12 ? 'Moderate' : 'Strong';

/* ── Stat tile ───────────────────────────────────────────────── */
const StatTile = ({ icon, label, value, sub, accentColor = '#38bdf8' }) => (
  <div style={{
    fontFamily: "'Inter',sans-serif",
    background: 'rgba(255,255,255,0.07)',
    borderRadius: '16px',
    padding: '16px 14px',
    border: '1px solid rgba(255,255,255,0.1)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    transition: 'transform 0.2s ease, background 0.2s ease',
    cursor: 'default',
  }}
    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'none'; }}
  >
    <span style={{ fontSize: '20px', lineHeight: 1 }}>{icon}</span>
    <span style={{ fontFamily:"'Inter',sans-serif", fontSize: '22px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1 }}>
      {value}
    </span>
    <span style={{ fontFamily:"'Inter',sans-serif", fontSize: '11px', fontWeight: '500', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
      {label}
    </span>
    {sub && (
      <span style={{ fontFamily:"'Inter',sans-serif", fontSize: '11px', fontWeight: '600', color: accentColor, marginTop: '2px' }}>{sub}</span>
    )}
  </div>
);

/* ── Main component ──────────────────────────────────────────── */
const WeatherComponent = ({ initialLat, initialLon, onWeatherFetch }) => {
  const { t } = useTranslation();
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState('');

  const fetchWeather = async (lat, lon) => {
    const latNum = Number(lat);
    const lonNum = Number(lon);
    const coordinateLabel = `${latNum.toFixed(4)}, ${lonNum.toFixed(4)}`;
    setWeatherLoading(true);
    setWeatherError('');
    try {
      const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
      if (!apiKey) throw new Error('Missing VITE_WEATHER_API_KEY');
      const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
        params: { lat, lon, units: 'metric', appid: apiKey }
      });
      const data = response.data || {};
      const countryCode = data?.sys?.country;
      const countryName =
        countryCode && typeof Intl !== 'undefined' && Intl.DisplayNames
          ? new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode)
          : countryCode;
      const locationName = data?.name && countryName ? `${data.name}, ${countryName}` : coordinateLabel;
      const weatherData = {
        temp: data?.main?.temp ?? null,
        feelsLike: data?.main?.feels_like ?? null,
        humidity: data?.main?.humidity ?? null,
        description: data?.weather?.[0]?.description ?? null,
        pressure: data?.main?.pressure ?? null,
        windSpeed: data?.wind?.speed ?? null,
        windDeg: data?.wind?.deg ?? null,
        visibility: data?.visibility ?? null,
        location: locationName,
        coordinates: coordinateLabel,
        icon: data?.weather?.[0]?.icon ?? null,
      };
      setWeather(weatherData);
      onWeatherFetch?.(weatherData);
    } catch (error) {
      console.error('Error fetching weather:', error);
      const fallbackData = {
        temp: null, feelsLike: null, humidity: null, description: null,
        pressure: null, windSpeed: null, location: coordinateLabel, coordinates: coordinateLabel,
      };
      setWeather(fallbackData);
      setWeatherError('Live weather unavailable. Showing last known location.');
      onWeatherFetch?.(fallbackData);
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    const latNum = Number(initialLat);
    const lonNum = Number(initialLon);
    if (Number.isFinite(latNum) && Number.isFinite(lonNum)) {
      fetchWeather(latNum, lonNum);
    }
  }, [initialLat, initialLon]);

  const theme = getWeatherTheme(weather?.description, weather?.temp);

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* ── Card ── */}
      <div style={{
        background: theme.sky,
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)',
        position: 'relative',
      }}>
        {/* Decorative blobs */}
        <div style={{ position:'absolute',top:'-60px',right:'-60px',width:'220px',height:'220px',borderRadius:'50%',background:'rgba(255,255,255,0.04)',pointerEvents:'none' }} />
        <div style={{ position:'absolute',bottom:'-40px',left:'-40px',width:'160px',height:'160px',borderRadius:'50%',background:'rgba(255,255,255,0.03)',pointerEvents:'none' }} />

        {/* ── Top hero area ── */}
        <div style={{ padding: '28px 28px 24px', position: 'relative', zIndex: 1 }}>
          {/* Header row */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'12px', marginBottom:'28px' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                <span style={{ fontSize:'13px', fontWeight:'600', color:'rgba(255,255,255,0.55)', textTransform:'uppercase', letterSpacing:'0.1em' }}>
                  {t('currentWeatherConditions') || 'Current Weather'}
                </span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ fontSize:'18px' }}>📍</span>
                <span style={{ fontSize:'18px', fontWeight:'800', color:'#ffffff', letterSpacing:'-0.02em' }}>
                  {weatherLoading ? '…' : (weather?.location || weather?.coordinates || '—')}
                </span>
              </div>
              <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', marginTop:'3px', paddingLeft:'26px' }}>
                {weather?.coordinates && weather.coordinates !== weather?.location ? weather.coordinates : ''}
              </div>
            </div>

            {/* Loading / Error pill */}
            {weatherLoading && (
              <div style={{ display:'flex',alignItems:'center',gap:'7px',padding:'7px 14px',borderRadius:'20px',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.15)' }}>
                <svg style={{width:'13px',height:'13px',animation:'wspin 1s linear infinite',color:'rgba(255,255,255,0.7)'}} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle style={{opacity:.25}} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path style={{opacity:.75}} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span style={{fontSize:'12px',fontWeight:'600',color:'rgba(255,255,255,0.7)'}}>Fetching…</span>
              </div>
            )}
            {!weatherLoading && weatherError && (
              <div style={{ padding:'7px 13px',borderRadius:'20px',background:'rgba(245,158,11,0.15)',border:'1px solid rgba(245,158,11,0.3)',fontSize:'12px',fontWeight:'600',color:'#fcd34d' }}>
                ⚠ {weatherError}
              </div>
            )}
          </div>

          {/* Big temperature + condition */}
          {!weatherLoading && weather && (
            <div style={{ display:'flex', alignItems:'flex-end', gap:'20px', flexWrap:'wrap' }}>
              {/* Temp */}
              <div style={{ display:'flex', alignItems:'flex-start', gap:'8px' }}>
                <span style={{ fontSize:'clamp(56px,10vw,88px)', fontWeight:'900', color:'#ffffff', lineHeight:1, letterSpacing:'-0.04em' }}>
                  {weather.temp !== null ? Math.round(weather.temp) : '—'}
                </span>
                <span style={{ fontSize:'clamp(28px,5vw,42px)', fontWeight:'700', color:'rgba(255,255,255,0.6)', marginTop:'8px' }}>°C</span>
              </div>

              {/* Condition + feels like */}
              <div style={{ paddingBottom:'10px' }}>
                <div style={{ fontSize:'clamp(18px,3.5vw,26px)', fontWeight:'700', color:'rgba(255,255,255,0.9)', textTransform:'capitalize', letterSpacing:'-0.01em', display:'flex', alignItems:'center', gap:'10px' }}>
                  <span style={{ fontSize: 'clamp(28px,5vw,40px)' }}>{theme.icon}</span>
                  {weather.description
                    ? (t(weather.description) || weather.description)
                    : (weatherError ? 'Unavailable' : '—')}
                </div>
                {weather.feelsLike !== null && (
                  <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.5)', marginTop:'5px' }}>
                    Feels like <strong style={{color:'rgba(255,255,255,0.75)'}}>{Math.round(weather.feelsLike)}°C</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {weatherLoading && (
            <div style={{ display:'flex', alignItems:'flex-end', gap:'20px' }}>
              <div style={{ width:'160px', height:'80px', borderRadius:'12px', background:'rgba(255,255,255,0.08)', animation:'wpulse 1.5s ease-in-out infinite' }} />
              <div style={{ paddingBottom:'10px', display:'flex', flexDirection:'column', gap:'8px' }}>
                <div style={{ width:'120px', height:'28px', borderRadius:'8px', background:'rgba(255,255,255,0.08)', animation:'wpulse 1.5s ease-in-out infinite' }} />
                <div style={{ width:'80px', height:'16px', borderRadius:'6px', background:'rgba(255,255,255,0.05)', animation:'wpulse 1.5s ease-in-out infinite' }} />
              </div>
            </div>
          )}
        </div>

        {/* ── Divider ── */}
        <div style={{ height:'1px', background:'rgba(255,255,255,0.08)', margin:'0 28px' }} />

        {/* ── Stats grid ── */}
        <div style={{
          padding: '20px 28px 28px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '12px',
          position: 'relative',
          zIndex: 1,
        }}>
          {weatherLoading ? (
            [1,2,3,4].map(i => (
              <div key={i} style={{ height:'96px', borderRadius:'16px', background:'rgba(255,255,255,0.07)', animation:'wpulse 1.5s ease-in-out infinite' }} />
            ))
          ) : weather ? (
            <>
              <StatTile
                icon="💧"
                label={t('humidity') || 'Humidity'}
                value={weather.humidity !== null ? `${weather.humidity}%` : 'N/A'}
                sub={getHumidityLabel(weather.humidity)}
                accentColor="#7dd3fc"
              />
              <StatTile
                icon="🌬️"
                label={t('windSpeed') || 'Wind Speed'}
                value={weather.windSpeed !== null ? `${weather.windSpeed} m/s` : 'N/A'}
                sub={getWindLabel(weather.windSpeed)}
                accentColor="#a5f3fc"
              />
              <StatTile
                icon="🔵"
                label={t('pressure') || 'Pressure'}
                value={weather.pressure !== null ? `${weather.pressure}` : 'N/A'}
                sub={weather.pressure !== null ? 'hPa' : ''}
                accentColor="#93c5fd"
              />
              {weather.visibility !== null && (
                <StatTile
                  icon="👁️"
                  label="Visibility"
                  value={weather.visibility !== null ? `${(weather.visibility / 1000).toFixed(1)} km` : 'N/A'}
                  sub={weather.visibility >= 10000 ? 'Excellent' : weather.visibility >= 5000 ? 'Good' : 'Poor'}
                  accentColor="#86efac"
                />
              )}
            </>
          ) : null}
        </div>
      </div>

      <style>{`
        @keyframes wspin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes wpulse { 0%,100%{opacity:.6} 50%{opacity:1} }
      `}</style>
    </div>
  );
};

export default WeatherComponent;
