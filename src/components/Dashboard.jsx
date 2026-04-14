import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import {
  GoogleMap,
  LoadScript,
  Marker,
  Polygon,
} from '@react-google-maps/api';
import {
  Leaf,
  Bot,
  Trees,
  FlaskConical,
  CloudRain,
  Map,
  BarChart3,
  User,
  LogOut,
  Menu,
  X,
  Globe,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Camera,
  Shield,
  Calendar,
  RefreshCw,
  LayoutDashboard,
  Zap,
  Sprout,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import AgroforestryPlanner from './AgroforestryPlanner';
import AIPlanner from './AIPlanner';
import agroIntelService from '../services/agroIntelService';
import FeedbackForm from './FeedbackForm';
import mapStorageService from '../services/mapStorageService';
import { generateLandLayoutMap as generateMapUtil } from '../utils/api';
import WeatherComponent from './WeatherComponent';
import RainfallComponent from './RainfallComponent';
import SoilAnalysisComponent from './SoilAnalysisComponent';

/* ─── constants ─────────────────────────────────────────────── */
const mapContainerStyle = { width: '100%', height: '400px' };
const defaultCenter = { lat: 12.9629, lng: 77.5775 };
const farmPolygon = [
  { lat: 12.9629, lng: 77.5775 },
  { lat: 12.9629, lng: 77.5775 },
  { lat: 12.9629, lng: 77.5775 },
  { lat: 12.9629, lng: 77.5775 },
];

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'aiplanner', label: 'AI Planner', icon: Bot },
  { id: 'agroforestry', label: 'Agroforestry', icon: Trees },
  { id: 'soil', label: 'Soil Analysis', icon: FlaskConical },
  { id: 'weather', label: 'Weather & Rain', icon: CloudRain },
  { id: 'map', label: 'Farm Map', icon: Map },
  { id: 'predictions', label: 'Predictions', icon: BarChart3 },
  { id: 'profile', label: 'Profile', icon: User },
];

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'हि' },
  { code: 'mr', label: 'म' },
  { code: 'te', label: 'తె' },
  { code: 'kn', label: 'ಕ' },
];

/* ─── small reusable atoms ───────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const Card = ({ children, className = '' }) => (
  <div
    className={`bg-white rounded-2xl shadow-sm border border-green-100 ${className}`}
  >
    {children}
  </div>
);

const StatBadge = ({ icon: Icon, label, value, color = 'green' }) => {
  const colors = {
    green: { bg: 'bg-green-100', text: 'text-green-700', icon: 'text-green-600' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'text-amber-600' },
    sky: { bg: 'bg-sky-100', text: 'text-sky-700', icon: 'text-sky-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-700', icon: 'text-purple-600' },
  };
  const c = colors[color] || colors.green;
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className={`flex items-center gap-3 p-4 rounded-xl ${c.bg}`}
    >
      <div className={`p-2 bg-white rounded-lg shadow-sm ${c.icon}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className={`text-lg font-bold ${c.text}`}>{value}</p>
      </div>
    </motion.div>
  );
};

/* ─── ProfilePage ────────────────────────────────────────────── */
const ProfilePage = ({ user, onLogout, t }) => {
  const displayName = user?.displayName || 'Farmer';
  const email = user?.email || 'Not linked';
  const phone = user?.phoneNumber || 'Not linked';
  const joined = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
    : '—';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Avatar + name hero */}
      <Card className="overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-green-700 via-green-600 to-emerald-500 relative">
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg,transparent,transparent 10px,rgba(255,255,255,.05) 10px,rgba(255,255,255,.05) 20px)',
            }}
          />
        </div>
        <div className="px-6 pb-6 -mt-12 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg border-4 border-white">
              {initials}
            </div>
            <button
              title="Change photo"
              className="absolute -bottom-1 -right-1 bg-white border border-green-200 rounded-full p-1.5 shadow text-green-600 hover:bg-green-50 transition"
            >
              <Camera size={13} />
            </button>
          </div>
          <div className="flex-1 pb-1">
            <h2 className="text-xl font-bold text-gray-800">{displayName}</h2>
            <p className="text-sm text-green-600 font-medium flex items-center gap-1">
              <Leaf size={13} /> Organic Farmer · Digital Raitha
            </p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition font-medium text-sm"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </Card>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { icon: Mail, label: 'Email', value: email, },
          { icon: Phone, label: 'Phone', value: phone, },
          { icon: MapPin, label: 'Location', value: 'India' },
          { icon: Calendar, label: 'Member Since', value: joined },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label} className="p-5 flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl text-green-600">
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">{label}</p>
              <p className="text-sm font-semibold text-gray-700 break-all">{value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Account security */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-4">
          <Shield size={16} className="text-green-600" /> Account Security
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Email verified', ok: user?.emailVerified },
            { label: 'Two-factor auth', ok: false },
          ].map(({ label, ok }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-600">{label}</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ok
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
                  }`}
              >
                {ok ? 'Active' : 'Not set'}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};

/* ─── PredictionsTab ─────────────────────────────────────────── */
const PredictionsTab = ({ realTimePredictions, t }) => {
  if (!realTimePredictions) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">{t('loadingPredictions')}</p>
      </div>
    );
  }

  const { predictions, recommendations, weather_data, costs } = realTimePredictions;
  const yieldVal = predictions?.yield_kg_per_acre || 3000;
  const potential = yieldVal > 3000 ? 'High' : yieldVal > 2000 ? 'Medium' : 'Low';
  const potentialColor =
    potential === 'High'
      ? 'text-green-700 bg-green-100'
      : potential === 'Medium'
        ? 'text-amber-700 bg-amber-100'
        : 'text-red-700 bg-red-100';

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-5">
      {/* Crop cards */}
      <Card className="p-5">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-4">
          <Leaf size={16} className="text-green-600" /> {t('recommendedCrops')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { crop: recommendations?.best_crop || 'Maize', note: t('bestCropForConditions'), color: 'bg-green-50 border-green-200 text-green-800' },
            { crop: t('cowpea') || 'Cowpea', note: t('nitrogenFixingCrop'), color: 'bg-sky-50 border-sky-200 text-sky-800' },
            { crop: t('turmeric') || 'Turmeric', note: t('highValueCrop'), color: 'bg-amber-50 border-amber-200 text-amber-800' },
          ].map(({ crop, note, color }) => (
            <div key={crop} className={`rounded-xl border p-4 text-center ${color}`}>
              <p className="text-xl font-bold">{crop}</p>
              <p className="text-xs mt-1 opacity-70">{note}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Yield stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatBadge icon={BarChart3} label={t('estimatedYieldPerAcre')} value={`${yieldVal.toLocaleString()} kg`} color="sky" />
        <StatBadge icon={Leaf} label={t('estimatedRevenue')} value="₹1,20,000" color="green" />
        <div className={`flex items-center gap-3 p-4 rounded-xl ${potentialColor} border`}>
          <span className="text-2xl font-extrabold">{potential}</span>
          <div>
            <p className="text-xs font-medium opacity-70">{t('yieldPotential')}</p>
            <p className="text-xs opacity-60">{t('confidence')}: {predictions?.confidence ? (predictions.confidence * 100).toFixed(0) : 85}%</p>
          </div>
        </div>
      </div>

      {/* ROI */}
      <Card className="p-5">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-4">
          💰 {t('roiAndCostBenefit')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t('returnOnInvestment'), value: `${predictions?.roi?.toFixed(1) || '2.8'}x`, color: 'bg-green-50 text-green-800' },
            { label: t('estimatedInvestment'), value: '₹50,000', color: 'bg-sky-50 text-sky-800' },
            { label: t('estimatedIncome'), value: '₹1,20,000', color: 'bg-purple-50 text-purple-800' },
            { label: t('paybackPeriod'), value: `${predictions?.payback_period || 18} mo`, color: 'bg-amber-50 text-amber-800' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl p-4 text-center ${color}`}>
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs mt-1 opacity-70">{label}</p>
            </div>
          ))}
        </div>

        {/* cost breakdown */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm font-semibold text-gray-600 mb-3">{t('costBreakdown')}</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: t('seedsAndSaplings'), val: costs?.seeds_and_saplings || 8000 },
              { label: t('fertilizers'), val: costs?.fertilizers || 12000 },
              { label: t('labor'), val: costs?.labor || 15000 },
            ].map(({ label, val }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                <p className="text-sm font-bold text-green-700">₹{val.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Weather conditions */}
      <Card className="p-5">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-4">
          🌤️ {t('currentWeatherConditions')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t('temperature'), value: `${weather_data?.avg_temperature_c || 28}°C`, color: 'bg-sky-50 text-sky-800' },
            { label: t('humidity'), value: `${weather_data?.avg_humidity || 65}%`, color: 'bg-green-50 text-green-800' },
            { label: t('annualRainfall'), value: `${weather_data?.avg_rainfall_mm || 980} mm`, color: 'bg-amber-50 text-amber-800' },
            { label: t('solarRadiation'), value: `${weather_data?.solar_radiation || 5.5} kWh/m²`, color: 'bg-purple-50 text-purple-800' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl p-4 text-center ${color}`}>
              <p className="text-lg font-bold">{value}</p>
              <p className="text-xs mt-1 opacity-70">{label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Recommendations checklist */}
      <Card className="p-5">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-4">
          ✅ {t('recommendations')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-2">{t('plantingRecommendations')}</p>
            <ul className="space-y-2">
              {[
                `${t('plantingTime')}: ${recommendations?.planting_time || 'June-July'}`,
                `${t('irrigationNeeds')}: ${recommendations?.irrigation_needs || 'Moderate'}`,
                `${t('soilPreparation')}: ${t('addOrganicCompost')}`,
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-0.5 text-green-500 font-bold">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-2">{t('harvestingTips')}</p>
            <ul className="space-y-2">
              {[
                `${t('monitorCropHealth')}: ${t('checkPestsDiseases')}`,
                `${t('optimalHarvestTime')}: ${t('harvestWhenMature')}`,
                `${t('postHarvestHandling')}: ${t('dryGrainsProperly')}`,
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-0.5 text-green-500 font-bold">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

/* ─── FarmMapTab ─────────────────────────────────────────────── */
const FarmMapTab = ({ center, mapId, onGenerateMap, t }) => (
  <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-5">
    <Card className="p-5">
      <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
        <Map size={18} className="text-green-600" /> {t('farmMap')}
      </h2>
      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={16}>
          <Polygon
            paths={farmPolygon}
            options={{ fillColor: '#34D399', fillOpacity: 0.3, strokeColor: '#059669', strokeWeight: 2 }}
          />
          <Marker position={center} />
        </GoogleMap>
      </LoadScript>
    </Card>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatBadge icon={Leaf} label={t('farmArea')} value="2.5 acres" color="green" />
      <StatBadge icon={MapPin} label={t('gpsCoordinates')} value={`${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`} color="sky" />
      <StatBadge icon={Shield} label={t('boundaryStatus')} value={t('verified')} color="purple" />
    </div>

    <Card className="p-5">
      <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-4">
        🗺️ {t('aiGeneratedLandLayout')}
      </h3>
      <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
        <iframe
          src="/api/latest-map"
          title="AI Land Layout Map"
          className="w-full h-80 border-0"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onGenerateMap}
          className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium text-sm transition"
        >
          <RefreshCw size={15} /> {t('refreshLandLayout')}
        </button>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {[
            { color: 'bg-green-500', label: `${t('mainCropArea')} 60%` },
            { color: 'bg-yellow-500', label: `${t('intercropArea')} 25%` },
            { color: 'bg-green-900', label: `${t('treesArea')} 15%` },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1">
              <span className={`w-3 h-3 rounded-sm ${color}`} /> {label}
            </span>
          ))}
        </div>
      </div>
      {mapId && (
        <p className="mt-3 text-xs text-green-600">
          {t('mapStoredInFirebase')} ID: {mapId}
        </p>
      )}
    </Card>
  </motion.div>
);

/* ─── OverviewPage ───────────────────────────────────────────── */
const OverviewPage = ({ user, weather, onNavigate }) => {
  const firstName = (user?.displayName || 'Farmer').split(' ')[0];

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good Morning' :
      hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const greetEmoji =
    hour < 12 ? '🌅' : hour < 17 ? '☀️' : '🌙';

  /* weather display helpers */
  const temp = weather?.temp != null ? `${Math.round(weather.temp)}°C` : '—';
  const humidity = weather?.humidity != null ? `${weather.humidity}%` : '—';
  const windSpeed = weather?.wind != null ? `${weather.wind} km/h` : '—';
  const rainChance = weather?.rain_chance != null ? `${weather.rain_chance}%` : weather ? '20%' : '—';
  const weatherDesc = weather?.description || 'Partly Cloudy';
  const locationName = weather?.location || 'Your Farm';

  const quickActions = [
    {
      id: 'aiplanner',
      icon: Bot,
      emoji: '🤖',
      title: 'Get Crop Recommendation',
      desc: 'AI-powered plan based on your soil & weather',
      gradient: 'from-green-500 to-emerald-600',
      badge: 'AI Powered',
    },
    {
      id: 'agroforestry',
      icon: Trees,
      emoji: '🌳',
      title: 'Explore Agroforestry',
      desc: 'Multi-cropping & shade tree strategies',
      gradient: 'from-teal-500 to-cyan-600',
      badge: 'Popular',
    },
    {
      id: 'soil',
      icon: FlaskConical,
      emoji: '🧪',
      title: 'Soil Health Check',
      desc: 'Live SoilGrids analysis for your location',
      gradient: 'from-amber-500 to-orange-500',
      badge: 'Live Data',
    },
    {
      id: 'predictions',
      icon: TrendingUp,
      emoji: '📈',
      title: 'Yield Predictions',
      desc: 'ROI, expected harvest & cost breakdown',
      gradient: 'from-purple-500 to-violet-600',
      badge: 'ML Model',
    },
  ];

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Welcome hero ── */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #16a34a 0%, #059669 50%, #064e3b 100%)',
          minHeight: 180,
          boxShadow: 'inset 0 2px 10px rgba(255,255,255,0.1)',
        }}
      >
        {/* decorative light beams & glowing orbs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-emerald-300/30 blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-green-300/20 blur-[80px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-yellow-200/10 blur-[60px] pointer-events-none" />

        <div className="relative z-10 p-7">
          <p className="text-green-300 text-sm font-semibold mb-1 tracking-wide">
            {greetEmoji} {greeting}
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Hello, {firstName}! 👋
          </h1>
          <p className="text-green-200 mt-2 text-sm sm:text-base max-w-lg">
            Here's your farm dashboard. Let AI guide your farming decisions today.
          </p>

          {/* weather mini badge inside hero */}
          {weather && (
            <div className="mt-5 inline-flex items-center gap-3 bg-white/10 border border-white/20 backdrop-blur-sm rounded-2xl px-4 py-2.5">
              <Thermometer size={16} className="text-amber-300" />
              <span className="text-white font-bold text-sm">{temp}</span>
              <span className="text-green-200 text-xs">·</span>
              <Droplets size={14} className="text-blue-300" />
              <span className="text-white text-sm">{humidity}</span>
              <span className="text-green-200 text-xs">·</span>
              <span className="text-green-200 text-xs truncate max-w-[120px]">{locationName}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Weather widget ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <CloudRain size={14} /> Current Weather
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Thermometer, label: 'Temperature', value: temp, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
            { icon: Droplets, label: 'Humidity', value: humidity, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
            { icon: Wind, label: 'Wind Speed', value: windSpeed, color: 'text-teal-600', bg: 'bg-teal-50 border-teal-100' },
            { icon: CloudRain, label: 'Rain Chance', value: rainChance, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <motion.div
              key={label}
              whileHover={{ scale: 1.03 }}
              className={`rounded-2xl border p-4 ${bg}`}
            >
              <div className={`mb-2 ${color}`}><Icon size={20} /></div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </motion.div>
          ))}
        </div>
        {weather?.description && (
          <p className="mt-2 text-xs text-gray-400 flex items-center gap-1">
            <Sun size={11} /> {weatherDesc} · {locationName}
          </p>
        )}
      </div>

      {/* ── Quick actions ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Zap size={14} /> Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <motion.button
              key={action.id}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate(action.id)}
              className="text-left w-full"
            >
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-2xl flex-shrink-0 shadow-sm`}>
                  {action.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-gray-800 text-sm">{action.title}</p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-green-100 text-green-700 rounded-full flex-shrink-0">
                      {action.badge}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{action.desc}</p>
                </div>
                <ArrowRight size={16} className="text-gray-300 flex-shrink-0 mt-1" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Seasonal tip banner ── */}
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5 flex items-start gap-4">
        <div className="text-2xl flex-shrink-0">🌱</div>
        <div>
          <p className="font-bold text-green-800 text-sm mb-1">Seasonal Tip</p>
          <p className="text-green-700 text-xs leading-relaxed">
            It's a great time to prepare your soil for the upcoming Kharif season.
            Apply organic compost now and check for optimal moisture levels before sowing.
          </p>
        </div>
        <button
          onClick={() => onNavigate('soil')}
          className="flex-shrink-0 text-xs font-semibold text-green-700 px-3 py-1.5 bg-green-200 hover:bg-green-300 rounded-xl transition"
        >
          Check Soil
        </button>
      </div>
    </motion.div>
  );
};

/* ─── Dashboard ──────────────────────────────────────────────── */
const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const user = auth.currentUser;

  const [center, setCenter] = useState(defaultCenter);
  const [selectedLocation, setSelectedLocation] = useState(defaultCenter);
  const [weather, setWeather] = useState(null);
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [realTimePredictions, setRealTimePredictions] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [currentPredictionId, setCurrentPredictionId] = useState(null);
  const [mapId, setMapId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* geolocation */
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const loc = { lat: coords.latitude, lng: coords.longitude };
          setCenter(loc);
          fetchRealTimePredictions(loc.lat, loc.lng);
        },
        () => fetchRealTimePredictions(defaultCenter.lat, defaultCenter.lng),
      );
    } else {
      fetchRealTimePredictions(defaultCenter.lat, defaultCenter.lng);
    }
  }, []);

  /* static recommendations */
  useEffect(() => {
    setAiRecommendations({
      cropRotation: [
        { season: 'Kharif', crop: 'Rice', reason: 'High rainfall season' },
        { season: 'Rabi', crop: 'Wheat', reason: 'Cooler temperatures' },
        { season: 'Summer', crop: 'Moong Dal', reason: 'Drought-resistant legume' },
      ],
      soilManagement: [
        'Add organic compost to improve soil fertility',
        'Practice crop rotation to maintain soil health',
        'Use natural pest control methods',
        'Test soil pH seasonally and adjust with lime or sulfur',
        'Apply green manure crops during off-season',
      ],
      irrigation: [
        'Install drip irrigation for water efficiency',
        'Collect rainwater during monsoon season',
        'Schedule irrigation based on soil moisture levels',
      ],
    });
  }, []);

  const fetchRealTimePredictions = async (lat, lon) => {
    try {
      const farmerData = {
        location: { lat, lng: lon },
        land_area_acres: 2.5,
        soil: { ph: 6.8, organic_carbon: 1.2, nitrogen: 150, phosphorus: 30, potassium: 150 },
        budget_inr: 50000,
      };
      const predictions = await agroIntelService.fetchRealTimePredictions(farmerData);
      setRealTimePredictions(predictions);
      if (predictions?.prediction_id) setCurrentPredictionId(predictions.prediction_id);
    } catch {
      const mockId = `mock-pred-${Date.now()}`;
      setRealTimePredictions({
        prediction_id: mockId,
        predictions: { yield_kg_per_acre: 3000, confidence: 0.85, roi: 2.8, payback_period: 18 },
        recommendations: { best_crop: 'Maize', planting_time: 'June-July', irrigation_needs: 'Moderate' },
        weather_data: { avg_temperature_c: 28, avg_humidity: 65, avg_rainfall_mm: 980, solar_radiation: 5.5 },
        costs: { seeds_and_saplings: 8000, fertilizers: 12000, labor: 15000 },
      });
      setCurrentPredictionId(mockId);
    }
  };

  const handleLogout = async () => {
    try { await signOut(auth); } catch (e) { console.error(e); }
  };

  const handleGenerateMap = async () => {
    try {
      const mapData = {
        center_lat: center.lat, center_lon: center.lng, land_area_acres: 2.5, location: 'Farmer Location',
        soil_data: { ph: 6.8, organic_carbon: 1.2, nitrogen: 150, phosphorus: 30, potassium: 150, texture: 'Loam', drainage: 'Moderate' },
        weather_data: { rainfall_mm: weather?.rainfall_mm || 980, temperature_c: weather?.temp || 28, humidity: weather?.humidity || 65, solar_radiation: 5.5 },
        economic_data: { budget_inr: 50000, labor_availability: 'Medium', input_cost_type: 'Organic' },
      };
      const response = await generateMapUtil(mapData);
      if (response.success) {
        const stored = await mapStorageService.storeMap(
          { ...mapData, recommendation: response.recommendation, created_at: new Date(), user_id: auth.currentUser?.uid },
          response.map_file_path,
        );
        setMapId(stored.id);
        const iframe = document.querySelector('iframe[title="AI Land Layout Map"]');
        if (iframe) iframe.src = response.map_url || `/api/get-map/${encodeURIComponent(response.map_file_path.split('/').pop())}`;
      }
    } catch (e) { console.error(e); }
  };

  /* active tab label */
  const activeItem = NAV_ITEMS.find((n) => n.id === activeTab);

  /* sidebar link */
  const NavLink = ({ item }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
        className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
          ? 'bg-green-600 text-white shadow-md shadow-green-200'
          : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
          }`}
      >
        <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400'} />
        <span>{item.label}</span>
        {isActive && <ChevronRight size={14} className="ml-auto opacity-70" />}
      </motion.button>
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f7f2] flex" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* ── Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
        />
      )}

      {/* ── Sidebar — CSS-only slide on mobile, always visible on lg+ */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-green-100 flex flex-col
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:flex lg:shrink-0
        `}
        style={{ boxShadow: '4px 0 24px rgba(0,0,0,0.06)' }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-green-100">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center shadow-md">
            <Leaf size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm leading-tight">Digital Raitha</p>
            <p className="text-xs text-green-600">AI Farm Assistant</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto text-gray-400 hover:text-gray-600 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => <NavLink key={item.id} item={item} />)}
        </nav>

        {/* User footer */}
        <div
          className="m-3 p-3 bg-green-50 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-green-100 transition"
          onClick={() => { setActiveTab('profile'); setSidebarOpen(false); }}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {(user?.displayName || 'F').slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-700 truncate">{user?.displayName || 'Farmer'}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email || user?.phoneNumber || 'View Profile'}</p>
          </div>
          <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
        </div>
      </aside>

      {/* ── Main area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="bg-white border-b border-green-100 px-4 sm:px-6 py-3 flex items-center gap-3 sticky top-0 z-20"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-green-700 p-1.5 rounded-lg hover:bg-green-50"
          >
            <Menu size={22} />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
              {activeItem && <activeItem.icon size={18} className="text-green-600 flex-shrink-0" />}
              <span className="truncate">{activeItem?.label}</span>
            </h1>
            <p className="text-xs text-gray-400 hidden sm:block">Digital Raitha · AI-Powered Natural Farming</p>
          </div>

          {/* ── Language switcher (top-right) */}
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1.5">
            <Globe size={13} className="text-gray-400 mr-1 flex-shrink-0" />
            {LANGUAGES.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => i18n.changeLanguage(code)}
                title={code.toUpperCase()}
                className={`px-2 py-0.5 text-xs rounded-lg font-semibold transition ${i18n.language === code
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-green-50 hover:text-green-700'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* quick profile pill */}
          <button
            onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-xl hover:bg-green-100 transition"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
              {(user?.displayName || 'F').slice(0, 1).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:inline">
              {user?.displayName || 'Farmer'}
            </span>
          </button>
        </header>

        {/* Tab content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-5xl mx-auto">

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <OverviewPage
                user={user}
                weather={weather}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            )}

            {/* AI Planner — kept mounted */}
            <div style={{ display: activeTab === 'aiplanner' ? 'block' : 'none' }}>
              <AIPlanner onLocationChange={(loc) => setSelectedLocation(loc)} />
            </div>

            {/* Agroforestry — kept mounted */}
            <div style={{ display: activeTab === 'agroforestry' ? 'block' : 'none' }}>
              <AgroforestryPlanner />
            </div>

            {activeTab === 'soil' && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible">
                <SoilAnalysisComponent lat={selectedLocation.lat} lon={selectedLocation.lng} aiRecommendations={aiRecommendations} />
              </motion.div>
            )}

            {activeTab === 'weather' && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-5">
                <WeatherComponent initialLat={selectedLocation.lat} initialLon={selectedLocation.lng} onWeatherFetch={setWeather} />
                <RainfallComponent lat={selectedLocation.lat} lon={selectedLocation.lng} aiRecommendations={aiRecommendations} />
              </motion.div>
            )}

            {activeTab === 'map' && (
              <FarmMapTab center={center} mapId={mapId} onGenerateMap={handleGenerateMap} t={t} />
            )}

            {activeTab === 'predictions' && (
              <PredictionsTab realTimePredictions={realTimePredictions} t={t} />
            )}

            {activeTab === 'profile' && (
              <ProfilePage user={user} onLogout={handleLogout} t={t} />
            )}

          </div>
        </main>
      </div>

      {/* Feedback modal */}
      <AnimatePresence>
        {showFeedbackForm && currentPredictionId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-5 bg-gradient-to-r from-green-700 to-emerald-600 rounded-t-2xl">
                <h3 className="text-white font-bold flex items-center gap-2">📝 {t('provideFeedback')}</h3>
                <button
                  onClick={() => setShowFeedbackForm(false)}
                  className="text-white/80 hover:text-white p-1"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <FeedbackForm predictionId={currentPredictionId} onClose={() => setShowFeedbackForm(false)} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Google font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`}</style>
    </div>
  );
};

export default Dashboard;
