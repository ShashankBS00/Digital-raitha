import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import {
  Leaf, Bot, Trees, FlaskConical, CloudRain, BarChart3, User,
  LogOut, Menu, X, Globe, ChevronRight, Mail, Phone, MapPin, Camera,
  Shield, Calendar, LayoutDashboard, Zap, Sprout,
  Thermometer, Droplets, Wind, Sun, TrendingUp, ArrowRight,
  CheckCircle2, AlertCircle, Star, Activity, Wallet,
} from 'lucide-react';
import AgroforestryPlanner from './AgroforestryPlanner';
import AIPlanner from './AIPlanner';
import agroIntelService from '../services/agroIntelService';
import FeedbackForm from './FeedbackForm';
import WeatherComponent from './WeatherComponent';
import RainfallComponent from './RainfallComponent';
import SoilAnalysisComponent from './SoilAnalysisComponent';

/* ─── constants ──────────────────────────────────────────────── */
const defaultCenter = { lat: 12.9629, lng: 77.5775 };

const NAV_ITEMS = [
  { id: 'overview',     label: 'Overview',     icon: LayoutDashboard },
  { id: 'aiplanner',   label: 'AI Planner',   icon: Bot },
  { id: 'agroforestry',label: 'Agroforestry', icon: Trees },
  { id: 'soil',        label: 'Soil Analysis',icon: FlaskConical },
  { id: 'weather',     label: 'Weather & Rain',icon: CloudRain },
  { id: 'predictions', label: 'Predictions',  icon: BarChart3 },
  { id: 'profile',     label: 'Profile',      icon: User },
];

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'hi', label: 'हि' },
  { code: 'mr', label: 'म' },
  { code: 'te', label: 'తె' },
  { code: 'kn', label: 'ಕ' },
];

/* ─── Design tokens ──────────────────────────────────────────── */
const C = {
  heading: '#111827',
  text:    '#4b5563',
  light:   '#9ca3af',
  glass:   'rgba(255,255,255,0.80)',
  glassBorder: 'rgba(255,255,255,0.40)',
};

/* ─── Motion variants ────────────────────────────────────────── */
const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: i * 0.07, ease: 'easeOut' },
  }),
};

const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const scaleIn = {
  hidden:  { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } },
};

/* ─── Reusable atoms ─────────────────────────────────────────── */

/** Glass card */
const GlassCard = ({ children, className = '', style = {} }) => (
  <div
    className={`rounded-2xl border ${className}`}
    style={{
      background: C.glass,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderColor: C.glassBorder,
      boxShadow: '0 8px 32px rgba(0,0,0,0.07)',
      ...style,
    }}
  >
    {children}
  </div>
);

/** Stat card with hover lift */
const StatCard = ({ icon: Icon, label, value, color, bg, i = 0 }) => (
  <motion.div
    custom={i}
    variants={fadeUp}
    whileHover={{ y: -3, boxShadow: '0 12px 32px rgba(0,0,0,0.12)' }}
    className="rounded-2xl p-4 border flex items-center gap-3"
    style={{ background: bg, borderColor: C.glassBorder, backdropFilter: 'blur(12px)' }}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}
      style={{ background: 'rgba(255,255,255,0.6)' }}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.light }}>{label}</p>
      <p className="text-lg font-bold mt-0.5" style={{ color: C.heading }}>{value}</p>
    </div>
  </motion.div>
);

/* ─── Section label ──────────────────────────────────────────── */
const SectionLabel = ({ icon: Icon, children }) => (
  <div className="flex items-center gap-2 mb-3">
    <Icon size={13} style={{ color: C.light }} />
    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: C.light }}>
      {children}
    </span>
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   PROFILE PAGE
═══════════════════════════════════════════════════════════════ */
const ProfilePage = ({ user, onLogout, t }) => {
  const displayName = user?.displayName || 'Farmer';
  const email       = user?.email       || 'Not linked';
  const phone       = user?.phoneNumber || 'Not linked';
  const joined      = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : '—';
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const infoItems = [
    { icon: Mail,     label: 'Email',        value: email  },
    { icon: Phone,    label: 'Phone',        value: phone  },
    { icon: MapPin,   label: 'Location',     value: 'India' },
    { icon: Calendar, label: 'Member Since', value: joined },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-5">

      {/* ── Hero banner ── */}
      <motion.div variants={scaleIn}>
        <GlassCard className="overflow-hidden">
          {/* Gradient banner */}
          <div className="relative h-32 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #14532d 0%, #16a34a 60%, #22c55e 100%)' }}>
            {/* mesh */}
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 12px,rgba(255,255,255,.06) 12px,rgba(255,255,255,.06) 24px)' }} />
            {/* floating orb */}
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(134,239,172,0.35), transparent 70%)' }} />
            {/* logout top-right */}
            <button onClick={onLogout}
              className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white/80 hover:text-white border border-white/20 hover:bg-white/10 transition">
              <LogOut size={13} /> Logout
            </button>
          </div>

          {/* Avatar row */}
          <div className="px-6 pb-6 -mt-12 flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-xl border-4 border-white"
                style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}>
                {initials}
              </div>
              <button title="Change photo"
                className="absolute -bottom-1 -right-1 bg-white border border-green-200 rounded-full p-1.5 shadow-md text-green-600 hover:bg-green-50 transition">
                <Camera size={13} />
              </button>
            </div>
            <div className="flex-1 pb-1">
              <h2 className="text-xl font-bold" style={{ color: C.heading }}>{displayName}</h2>
              <p className="text-sm font-medium flex items-center gap-1.5 mt-0.5" style={{ color: '#16a34a' }}>
                <Leaf size={13} /> Organic Farmer · Digital Raitha
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  <Star size={10} /> Verified Farmer
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  <Activity size={10} /> Active
                </span>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* ── Info grid ── */}
      <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {infoItems.map(({ icon: Icon, label, value }, i) => (
          <motion.div key={label} custom={i} variants={fadeUp}>
            <GlassCard className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.15), rgba(34,197,94,0.1))' }}>
                <Icon size={18} style={{ color: '#16a34a' }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.light }}>{label}</p>
                <p className="text-sm font-semibold break-all mt-0.5" style={{ color: C.heading }}>{value}</p>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Account security ── */}
      <motion.div custom={4} variants={fadeUp}>
        <GlassCard className="p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-4" style={{ color: C.heading }}>
            <Shield size={16} style={{ color: '#16a34a' }} /> Account Security
          </h3>
          <div className="space-y-2">
            {[
              { label: 'Email verified', ok: user?.emailVerified },
              { label: 'Two-factor auth', ok: false },
            ].map(({ label, ok }) => (
              <div key={label} className="flex items-center justify-between py-3 border-b border-gray-100/80 last:border-0">
                <div className="flex items-center gap-2.5">
                  {ok
                    ? <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                    : <AlertCircle  size={16} className="text-amber-400 flex-shrink-0" />
                  }
                  <span className="text-sm" style={{ color: C.text }}>{label}</span>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  ok ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {ok ? 'Active' : 'Not set'}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PREDICTIONS TAB
═══════════════════════════════════════════════════════════════ */
const PredictionsTab = ({ realTimePredictions, t }) => {
  if (!realTimePredictions) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
        <p className="text-sm" style={{ color: C.light }}>{t('loadingPredictions')}</p>
      </div>
    );
  }

  const { predictions, recommendations, weather_data, costs } = realTimePredictions;
  const yieldVal = predictions?.yield_kg_per_acre || 3000;
  const potential = yieldVal > 3000 ? 'High' : yieldVal > 2000 ? 'Medium' : 'Low';
  const potentialColor = potential === 'High' ? '#16a34a' : potential === 'Medium' ? '#d97706' : '#dc2626';
  const potentialBg   = potential === 'High' ? '#f0fdf4'  : potential === 'Medium' ? '#fffbeb'  : '#fef2f2';

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-5">

      {/* Crop recommendation cards */}
      <motion.div variants={fadeUp} custom={0}>
        <GlassCard className="p-5">
          <h3 className="font-bold flex items-center gap-2 mb-4" style={{ color: C.heading }}>
            <Leaf size={16} style={{ color: '#16a34a' }} /> {t('recommendedCrops')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { crop: recommendations?.best_crop || 'Maize', note: t('bestCropForConditions'), gradient: 'from-green-500 to-emerald-600', badge: 'Best Match' },
              { crop: t('cowpea') || 'Cowpea',   note: t('nitrogenFixingCrop'), gradient: 'from-sky-500 to-cyan-600',    badge: 'N-Fixer' },
              { crop: t('turmeric') || 'Turmeric', note: t('highValueCrop'),   gradient: 'from-amber-500 to-orange-500', badge: 'High ROI' },
            ].map(({ crop, note, gradient, badge }, i) => (
              <motion.div key={crop} custom={i} variants={fadeUp} whileHover={{ y: -2 }}
                className={`rounded-2xl p-4 text-center bg-gradient-to-br ${gradient} shadow-lg`}>
                <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">{badge}</span>
                <p className="text-xl font-extrabold text-white mt-1">{crop}</p>
                <p className="text-xs text-white/70 mt-1">{note}</p>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* Yield stats row */}
      <motion.div variants={stagger} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={BarChart3} label={t('estimatedYieldPerAcre')} value={`${yieldVal.toLocaleString()} kg`}
          color="text-sky-600" bg="rgba(240,249,255,0.85)" i={0} />
        <StatCard icon={Wallet} label={t('estimatedRevenue')} value="₹1,20,000"
          color="text-green-600" bg="rgba(240,253,244,0.85)" i={1} />
        <motion.div custom={2} variants={fadeUp}
          className="rounded-2xl p-4 border flex items-center gap-3"
          style={{ background: potentialBg, borderColor: C.glassBorder }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${potentialColor}22` }}>
            <TrendingUp size={20} style={{ color: potentialColor }} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.light }}>Yield Potential</p>
            <p className="text-lg font-bold" style={{ color: potentialColor }}>{potential}</p>
            <p className="text-xs" style={{ color: C.light }}>
              {t('confidence')}: {predictions?.confidence ? (predictions.confidence * 100).toFixed(0) : 85}%
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* ROI breakdown */}
      <motion.div custom={3} variants={fadeUp}>
        <GlassCard className="p-5">
          <h3 className="font-bold flex items-center gap-2 mb-4" style={{ color: C.heading }}>
            <Wallet size={16} style={{ color: '#16a34a' }} /> {t('roiAndCostBenefit')}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: t('returnOnInvestment'), value: `${predictions?.roi?.toFixed(1) || '2.8'}x`, color: '#16a34a', bg: 'rgba(240,253,244,0.9)' },
              { label: t('estimatedInvestment'), value: '₹50,000', color: '#0284c7', bg: 'rgba(240,249,255,0.9)' },
              { label: t('estimatedIncome'),     value: '₹1,20,000', color: '#7c3aed', bg: 'rgba(245,243,255,0.9)' },
              { label: t('paybackPeriod'),        value: `${predictions?.payback_period || 18} mo`, color: '#d97706', bg: 'rgba(255,251,235,0.9)' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="rounded-xl p-4 text-center border" style={{ background: bg, borderColor: C.glassBorder }}>
                <p className="text-xl font-extrabold" style={{ color }}>{value}</p>
                <p className="text-[11px] mt-1" style={{ color: C.light }}>{label}</p>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-gray-100/80">
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: C.light }}>{t('costBreakdown')}</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: t('seedsAndSaplings'), val: costs?.seeds_and_saplings || 8000 },
                { label: t('fertilizers'),      val: costs?.fertilizers || 12000 },
                { label: t('labor'),             val: costs?.labor || 15000 },
              ].map(({ label, val }) => (
                <div key={label} className="rounded-xl p-3 text-center border border-gray-100/80 bg-gray-50/80">
                  <p className="text-sm font-bold" style={{ color: '#16a34a' }}>₹{val.toLocaleString()}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: C.light }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Weather snapshot */}
      <motion.div custom={4} variants={fadeUp}>
        <GlassCard className="p-5">
          <h3 className="font-bold flex items-center gap-2 mb-4" style={{ color: C.heading }}>
            <CloudRain size={16} style={{ color: '#16a34a' }} /> {t('currentWeatherConditions')}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: t('temperature'),   value: `${weather_data?.avg_temperature_c || 28}°C`, color: '#ea580c', bg: 'rgba(255,247,237,0.9)' },
              { label: t('humidity'),      value: `${weather_data?.avg_humidity || 65}%`,       color: '#0284c7', bg: 'rgba(240,249,255,0.9)' },
              { label: t('annualRainfall'),value: `${weather_data?.avg_rainfall_mm || 980} mm`, color: '#0d9488', bg: 'rgba(240,253,250,0.9)' },
              { label: t('solarRadiation'),value: `${weather_data?.solar_radiation || 5.5} kWh/m²`, color: '#7c3aed', bg: 'rgba(245,243,255,0.9)' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="rounded-xl p-4 text-center border" style={{ background: bg, borderColor: C.glassBorder }}>
                <p className="text-lg font-bold" style={{ color }}>{value}</p>
                <p className="text-[11px] mt-1" style={{ color: C.light }}>{label}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   OVERVIEW PAGE
═══════════════════════════════════════════════════════════════ */
const OverviewPage = ({ user, weather, onNavigate }) => {
  const firstName = (user?.displayName || 'Farmer').split(' ')[0];
  const hour = new Date().getHours();
  const greeting    = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const greetIcon   = hour < 12 ? Sun : hour < 17 ? Sun : Sun;

  const temp       = weather?.temp      != null ? `${Math.round(weather.temp)}°C` : '—';
  const humidity   = weather?.humidity  != null ? `${weather.humidity}%` : '—';
  const windSpeed  = weather?.wind      != null ? `${weather.wind} km/h` : '—';
  const rainChance = weather?.rain_chance != null ? `${weather.rain_chance}%` : weather ? '20%' : '—';
  const locationName = weather?.location || 'Your Farm';
  const weatherDesc  = weather?.description || 'Partly Cloudy';

  const quickActions = [
    {
      id: 'aiplanner',
      icon: Bot,
      title: 'AI Crop Planner',
      desc: 'Smart recommendations based on soil & weather',
      gradient: 'linear-gradient(135deg, #16a34a, #22c55e)',
      glow: 'rgba(22,163,74,0.35)',
      badge: 'AI',
      badgeColor: '#bbf7d0',
      badgeText: '#14532d',
    },
    {
      id: 'agroforestry',
      icon: Trees,
      title: 'Agroforestry',
      desc: 'Multi-cropping & shade tree strategies',
      gradient: 'linear-gradient(135deg, #0d9488, #06b6d4)',
      glow: 'rgba(13,148,136,0.30)',
      badge: 'Popular',
      badgeColor: '#ccfbf1',
      badgeText: '#134e4a',
    },
    {
      id: 'soil',
      icon: FlaskConical,
      title: 'Soil Health Check',
      desc: 'Live SoilGrids analysis for your coordinates',
      gradient: 'linear-gradient(135deg, #d97706, #f59e0b)',
      glow: 'rgba(217,119,6,0.28)',
      badge: 'Live',
      badgeColor: '#fef3c7',
      badgeText: '#78350f',
    },
    {
      id: 'predictions',
      icon: TrendingUp,
      title: 'Yield Predictions',
      desc: 'ROI forecast, harvest & cost breakdown',
      gradient: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
      glow: 'rgba(124,58,237,0.28)',
      badge: 'ML',
      badgeColor: '#ede9fe',
      badgeText: '#4c1d95',
    },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">

      {/* ── Hero ── */}
      <motion.div variants={scaleIn}>
        <div className="relative rounded-3xl overflow-hidden" style={{
          background: 'linear-gradient(135deg, #14532d 0%, #16a34a 55%, #22c55e 100%)',
          minHeight: 200,
          boxShadow: '0 16px 48px rgba(22,163,74,0.3)',
        }}>
          {/* Mesh overlay */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 14px,rgba(255,255,255,.08) 14px,rgba(255,255,255,.08) 28px)',
          }} />
          {/* Orbs */}
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(134,239,172,0.4), transparent 70%)' }} />
          <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(20,83,45,0.6), transparent 70%)' }} />

          <div className="relative z-10 p-7 sm:p-8">
            <p className="text-sm font-semibold mb-2" style={{ color: 'rgba(187,247,208,0.9)' }}>
              ☀️ {greeting}
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Hello, {firstName}! 👋
            </h1>
            <p className="mt-2 text-sm max-w-md" style={{ color: 'rgba(187,247,208,0.8)' }}>
              Here's your farm dashboard. Let AI guide your farming decisions today.
            </p>

            {/* Weather pill */}
            {weather && (
              <div className="mt-5 inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl border"
                style={{ background: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)' }}>
                <Thermometer size={16} style={{ color: '#fcd34d' }} />
                <span className="text-white font-bold text-sm">{temp}</span>
                <span style={{ color: 'rgba(187,247,208,0.6)' }}>·</span>
                <Droplets size={14} style={{ color: '#93c5fd' }} />
                <span className="text-white text-sm">{humidity}</span>
                <span style={{ color: 'rgba(187,247,208,0.6)' }}>·</span>
                <span className="text-xs" style={{ color: 'rgba(187,247,208,0.8)' }}>{locationName}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Live weather mini-stats ── */}
      <motion.div variants={fadeUp} custom={1}>
        <SectionLabel icon={CloudRain}>Current Weather</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Thermometer, label: 'Temperature', value: temp,       color: '#ea580c', bg: 'rgba(255,247,237,0.9)',  border: 'rgba(251,191,36,0.2)' },
            { icon: Droplets,   label: 'Humidity',    value: humidity,   color: '#0284c7', bg: 'rgba(240,249,255,0.9)',  border: 'rgba(125,211,252,0.2)' },
            { icon: Wind,       label: 'Wind Speed',  value: windSpeed,  color: '#0d9488', bg: 'rgba(240,253,250,0.9)',  border: 'rgba(94,234,212,0.2)' },
            { icon: CloudRain,  label: 'Rain Chance', value: rainChance, color: '#6366f1', bg: 'rgba(238,242,255,0.9)', border: 'rgba(165,180,252,0.2)' },
          ].map(({ icon: Icon, label, value, color, bg, border }, i) => (
            <motion.div key={label} custom={i} variants={fadeUp} whileHover={{ y: -3 }}
              className="rounded-2xl p-4 border"
              style={{ background: bg, borderColor: border, boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
              <div className="mb-2" style={{ color }}><Icon size={20} /></div>
              <p className="text-xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs mt-0.5" style={{ color: C.light }}>{label}</p>
            </motion.div>
          ))}
        </div>
        {weather?.description && (
          <p className="mt-2 text-xs flex items-center gap-1" style={{ color: C.light }}>
            <Sun size={11} /> {weatherDesc} · {locationName}
          </p>
        )}
      </motion.div>

      {/* ── Quick actions (floating glass cards) ── */}
      <motion.div variants={fadeUp} custom={2}>
        <SectionLabel icon={Zap}>Quick Actions</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.id}
                custom={i}
                variants={fadeUp}
                whileHover={{ y: -4, boxShadow: `0 20px 48px ${action.glow}` }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate(action.id)}
                className="text-left w-full"
              >
                <GlassCard className="p-5 flex items-start gap-4 transition-all duration-200">
                  {/* Icon box with gradient */}
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
                    style={{ background: action.gradient, boxShadow: `0 6px 20px ${action.glow}` }}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-sm" style={{ color: C.heading }}>{action.title}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: action.badgeColor, color: action.badgeText }}>
                        {action.badge}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: C.light }}>{action.desc}</p>
                  </div>
                  <ArrowRight size={16} style={{ color: C.light, flexShrink: 0, marginTop: 2 }} />
                </GlassCard>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Crop rotation strip ── */}
      <motion.div custom={6} variants={fadeUp}>
        <SectionLabel icon={Leaf}>Seasonal Crop Rotation</SectionLabel>
        <div className="grid grid-cols-3 gap-3">
          {[
            { season: 'Kharif', crop: 'Rice',     icon: Sprout,   color: '#16a34a', bg: 'rgba(240,253,244,0.9)',  border: 'rgba(74,222,128,0.2)' },
            { season: 'Rabi',   crop: 'Wheat',    icon: Sprout,   color: '#d97706', bg: 'rgba(255,251,235,0.9)',  border: 'rgba(252,211,77,0.2)' },
            { season: 'Summer', crop: 'Moong Dal',icon: Sprout, color: '#0284c7', bg: 'rgba(240,249,255,0.9)',  border: 'rgba(125,211,252,0.2)' },
          ].map(({ season, crop, icon: Icon, color, bg, border }) => (
            <div key={season} className="rounded-2xl p-4 border text-center"
              style={{ background: bg, borderColor: border }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2"
                style={{ background: `${color}22` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.light }}>{season}</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: C.heading }}>{crop}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Seasonal tip banner ── */}
      <motion.div custom={7} variants={fadeUp}>
        <div className="rounded-2xl p-5 flex items-start gap-4 border"
          style={{
            background: 'linear-gradient(135deg, rgba(240,253,244,0.95), rgba(236,253,245,0.95))',
            borderColor: 'rgba(74,222,128,0.25)',
            boxShadow: '0 4px 20px rgba(22,163,74,0.08)',
          }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
            style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}>
            <Sprout size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm mb-1" style={{ color: '#14532d' }}>🌱 Seasonal Tip</p>
            <p className="text-xs leading-relaxed" style={{ color: '#166534' }}>
              It's a great time to prepare your soil for the upcoming Kharif season.
              Apply organic compost now and check optimal moisture levels before sowing.
            </p>
          </div>
          <button onClick={() => onNavigate('soil')}
            className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: 'white', boxShadow: '0 4px 12px rgba(22,163,74,0.35)' }}>
            Check Soil
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD (root)
═══════════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const user = auth.currentUser;

  const [center, setCenter]                     = useState(defaultCenter);
  const [selectedLocation, setSelectedLocation] = useState(defaultCenter);
  const [weather, setWeather]                   = useState(null);
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [realTimePredictions, setRealTimePredictions] = useState(null);
  const [activeTab, setActiveTab]               = useState('overview');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [currentPredictionId, setCurrentPredictionId] = useState(null);
  const [sidebarOpen, setSidebarOpen]           = useState(false);

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
        { season: 'Kharif', crop: 'Rice',     reason: 'High rainfall season' },
        { season: 'Rabi',   crop: 'Wheat',    reason: 'Cooler temperatures' },
        { season: 'Summer', crop: 'Moong Dal',reason: 'Drought-resistant legume' },
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

  const activeItem = NAV_ITEMS.find(n => n.id === activeTab);

  /* ── Sidebar NavLink ── */
  const NavLink = ({ item }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all"
        style={isActive ? {
          background: 'linear-gradient(135deg, #15803d, #16a34a)',
          color: '#fff',
          boxShadow: '0 4px 18px rgba(21,128,61,0.32), inset 0 1px 0 rgba(255,255,255,0.15)',
        } : { color: C.text }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(22,163,74,0.08)'; }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
      >
        <Icon size={18} style={{ color: isActive ? '#fff' : C.light }} />
        <span>{item.label}</span>
        {isActive && <ChevronRight size={14} className="ml-auto opacity-60" />}
      </motion.button>
    );
  };

  /* ── Bottom nav items (5 most used) ── */
  const BOTTOM_NAV = NAV_ITEMS.slice(0, 5);

  return (
    <div className="min-h-screen flex" style={{
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      background: 'linear-gradient(150deg, #f0fdf4 0%, #ffffff 40%, #ecfdf5 80%, #f0fdf4 100%)',
    }}>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/30 z-30 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR ── */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : undefined }}
        className={`
          fixed inset-y-0 left-0 z-40 w-64 flex flex-col
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:flex lg:shrink-0
        `}
        style={{
          background: 'rgba(255,255,255,0.78)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(255,255,255,0.38)',
          boxShadow: '4px 0 32px rgba(0,0,0,0.07)',
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'rgba(22,163,74,0.12)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #15803d, #22c55e)' }}>
            <Leaf size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight" style={{ color: C.heading }}>Digital Raitha</p>
            <p className="text-xs" style={{ color: '#16a34a' }}>AI Farm Assistant</p>
          </div>
          <button onClick={() => setSidebarOpen(false)}
            className="ml-auto text-gray-400 hover:text-gray-600 lg:hidden p-1">
            <X size={18} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(item => <NavLink key={item.id} item={item} />)}
        </nav>

        {/* User footer card */}
        <motion.div
          whileHover={{ backgroundColor: 'rgba(22,163,74,0.10)' }}
          className="m-3 p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-colors"
          style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.1)' }}
          onClick={() => { setActiveTab('profile'); setSidebarOpen(false); }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md"
            style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}>
            {(user?.displayName || 'F').slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: C.heading }}>{user?.displayName || 'Farmer'}</p>
            <p className="text-xs truncate" style={{ color: C.light }}>{user?.email || user?.phoneNumber || 'View Profile'}</p>
          </div>
          <ChevronRight size={14} style={{ color: C.light, flexShrink: 0 }} />
        </motion.div>
      </motion.aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="px-4 sm:px-6 py-3 flex items-center gap-3 sticky top-0 z-20" style={{
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.42)',
          boxShadow: '0 2px 24px rgba(0,0,0,0.06)',
        }}>
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-green-50 transition"
            style={{ color: C.text }}>
            <Menu size={22} />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-bold flex items-center gap-2" style={{ color: C.heading }}>
              {activeItem && <activeItem.icon size={18} style={{ color: '#16a34a', flexShrink: 0 }} />}
              <span className="truncate">{activeItem?.label}</span>
            </h1>
            <p className="text-xs hidden sm:block" style={{ color: C.light }}>Digital Raitha · AI-Powered Natural Farming</p>
          </div>

          {/* Language switcher */}
          <div className="flex items-center gap-1 rounded-xl px-2 py-1.5 border"
            style={{ background: 'rgba(249,250,251,0.8)', borderColor: 'rgba(229,231,235,0.8)' }}>
            <Globe size={12} style={{ color: C.light, marginRight: 2 }} />
            {LANGUAGES.map(({ code, label }) => (
              <button key={code} onClick={() => i18n.changeLanguage(code)}
                className="px-2 py-0.5 text-xs rounded-lg font-semibold transition"
                style={i18n.language === code
                  ? { background: 'linear-gradient(135deg, #15803d, #16a34a)', color: '#fff' }
                  : { color: C.light }}>
                {label}
              </button>
            ))}
          </div>

          {/* Profile pill */}
          <button onClick={() => setActiveTab('profile')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition"
            style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.12)' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}>
              {(user?.displayName || 'F').slice(0, 1).toUpperCase()}
            </div>
            <span className="text-sm font-medium hidden sm:inline" style={{ color: C.heading }}>
              {user?.displayName || 'Farmer'}
            </span>
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 lg:pb-8">
          <div className="max-w-5xl mx-auto">

            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <OverviewPage key="overview" user={user} weather={weather} onNavigate={setActiveTab} />
              )}
            </AnimatePresence>

            {/* Always-mounted panels */}
            <div style={{ display: activeTab === 'aiplanner' ? 'block' : 'none' }}>
              <AIPlanner onLocationChange={loc => setSelectedLocation(loc)} />
            </div>
            <div style={{ display: activeTab === 'agroforestry' ? 'block' : 'none' }}>
              <AgroforestryPlanner />
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'soil' && (
                <motion.div key="soil" variants={fadeUp} initial="hidden" animate="visible">
                  <SoilAnalysisComponent lat={selectedLocation.lat} lon={selectedLocation.lng} aiRecommendations={aiRecommendations} />
                </motion.div>
              )}
              {activeTab === 'weather' && (
                <motion.div key="weather" variants={stagger} initial="hidden" animate="visible" className="space-y-5">
                  <WeatherComponent initialLat={selectedLocation.lat} initialLon={selectedLocation.lng} onWeatherFetch={setWeather} />
                  <RainfallComponent lat={selectedLocation.lat} lon={selectedLocation.lng} aiRecommendations={aiRecommendations} />
                </motion.div>
              )}
              {activeTab === 'predictions' && (
                <PredictionsTab key="predictions" realTimePredictions={realTimePredictions} t={t} />
              )}
              {activeTab === 'profile' && (
                <ProfilePage key="profile" user={user} onLogout={handleLogout} t={t} />
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* ── Feedback modal ── */}
      <AnimatePresence>
        {showFeedbackForm && currentPredictionId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.45)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 rounded-t-2xl"
                style={{ background: 'linear-gradient(135deg, #15803d, #16a34a)' }}>
                <h3 className="text-white font-bold flex items-center gap-2">
                  <CheckCircle2 size={18} /> {t('provideFeedback')}
                </h3>
                <button onClick={() => setShowFeedbackForm(false)} className="text-white/70 hover:text-white p-1">
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

      {/* ── BOTTOM NAV (mobile) ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderTop: '1px solid rgba(255,255,255,0.45)',
          boxShadow: '0 -6px 24px rgba(0,0,0,0.08)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {BOTTOM_NAV.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center gap-1 min-w-0 flex-1 py-2 px-1 transition-all">
              <motion.div
                whileTap={{ scale: 0.88 }}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                style={isActive ? {
                  background: 'linear-gradient(135deg, #15803d, #16a34a)',
                  boxShadow: '0 4px 14px rgba(21,128,61,0.38)',
                } : { background: 'transparent' }}
              >
                <Icon size={20} style={{ color: isActive ? '#fff' : C.light }} />
              </motion.div>
              <span className="text-[10px] font-semibold w-full text-center truncate"
                style={{ color: isActive ? '#16a34a' : C.light }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Font import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      `}</style>
    </div>
  );
};

export default Dashboard;
