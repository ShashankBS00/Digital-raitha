import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import agroIntelService from '../services/agroIntelService';
import {
  MapPin,
  Satellite,
  Home,
  Landmark,
  Map,
  Globe,
  Hash,
  Navigation,
  Loader2,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Rocket,
  Layers,
  Sprout,
  Wallet,
  AlertCircle,
  Info,
  ClipboardList,
  Settings2,
  TreePine,
} from 'lucide-react';

const FarmerInputForm = ({ onPlanGenerated }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    location: {
      type: 'gps',
      gps: { lat: '', lng: '' },
      village: {
        village: '',
        district: '',
        state: '',
        country: '',
        pincode: ''
      }
    },
    land_area: '',
    budget: '',
    crop_preference: '',
    investment_capacity: 'medium'
  });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [locationDetecting, setLocationDetecting] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          console.log('Geolocation not available or denied');
        }
      );
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'location_type') {
      setFormData(prev => ({
        ...prev,
        location: { ...prev.location, type: value }
      }));
    } else if (name === 'lat' || name === 'lng') {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          gps: { ...prev.location.gps, [name]: value }
        }
      }));
    } else if (['village', 'district', 'state', 'country', 'pincode'].includes(name)) {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          village: { ...prev.location.village, [name]: value }
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleUseCurrentLocation = () => {
    if (currentLocation) {
      setLocationDetecting(true);
      setTimeout(() => {
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            gps: {
              lat: currentLocation.lat.toString(),
              lng: currentLocation.lng.toString()
            }
          }
        }));
        setLocationDetecting(false);
      }, 800);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.land_area || !formData.budget) {
        throw new Error(t('pleaseFillRequiredFields'));
      }

      let lat, lng;
      if (formData.location.type === 'gps') {
        if (!formData.location.gps.lat || !formData.location.gps.lng) {
          throw new Error(t('pleaseEnterValidCoordinates'));
        }
        lat = parseFloat(formData.location.gps.lat);
        lng = parseFloat(formData.location.gps.lng);
        if (isNaN(lat) || isNaN(lng)) {
          throw new Error(t('pleaseEnterValidCoordinates'));
        }
      } else {
        const { village, district, state, country, pincode } = formData.location.village;
        if (!village && !district && !pincode) {
          throw new Error(t('pleaseEnterVillageDetails') || 'Please enter at least village, district, or pincode.');
        }
        const addressParts = [village, district, state, pincode, country].filter(Boolean);
        const addressStr = addressParts.join(', ');
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressStr)}&limit=1`
          );
          const geoData = await geoRes.json();
          if (geoData && geoData.length > 0) {
            lat = parseFloat(geoData[0].lat);
            lng = parseFloat(geoData[0].lon);
          } else {
            lat = 20.5937;
            lng = 78.9629;
          }
        } catch {
          lat = 20.5937;
          lng = 78.9629;
        }
      }

      const landArea = parseFloat(formData.land_area);
      const budget = parseFloat(formData.budget);

      if (isNaN(landArea) || isNaN(budget)) {
        throw new Error(t('pleaseEnterValidNumbers'));
      }

      let investmentCapacity = 'low';
      if (budget > 100000) investmentCapacity = 'high';
      else if (budget > 50000) investmentCapacity = 'medium';

      const soilData = await agroIntelService.fetchSoilData(lat, lng);
      const weatherData = await agroIntelService.fetchWeatherData(lat, lng);

      const inputs = {
        latitude: lat,
        longitude: lng,
        soil_pH: soilData.ph,
        organic_carbon: soilData.organic_carbon,
        nitrogen: soilData.nitrogen,
        cec: soilData.cec,
        sand: soilData.sand,
        silt: soilData.silt,
        clay: soilData.clay,
        avg_rainfall_mm: weatherData.avg_rainfall_mm,
        avg_temperature_c: weatherData.avg_temperature_c,
        solar_radiation: weatherData.solar_radiation,
        land_area: landArea,
        investment_capacity: investmentCapacity,
        crop_preference: formData.crop_preference || null
      };

      const plan = await agroIntelService.generateAgroforestryPlan(inputs);
      onPlanGenerated(plan, inputs);
    } catch (err) {
      console.error('Error generating plan:', err);
      setError(err.message || t('failedToGeneratePlan'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      location: {
        type: 'gps',
        gps: { lat: '', lng: '' },
        village: { village: '', district: '', state: '', country: '', pincode: '' }
      },
      land_area: '',
      budget: '',
      crop_preference: '',
      investment_capacity: 'medium'
    });
    setError(null);
    setActiveStep(0);
  };

  const steps = [
    { id: 0, label: t('location') || 'Location', icon: MapPin },
    { id: 1, label: t('farmDetails') || 'Farm Details', icon: TreePine },
    { id: 2, label: t('preferences') || 'Preferences', icon: Settings2 },
  ];

  /* ─── shared styles ─── */
  const inputBaseStyle = {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.85)',
    border: '1.5px solid rgba(16,185,129,0.2)',
    borderRadius: '12px',
    fontSize: '15px',
    color: '#1a3c2e',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    backdropFilter: 'blur(4px)',
  };

  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#166534',
    marginBottom: '7px',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  };

  /* ─── glassmorphic card wrapper ─── */
  const sectionCard = {
    background: 'rgba(255,255,255,0.80)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '22px',
    border: '1px solid rgba(255,255,255,0.45)',
    boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
  };

  const handleFocus = (e) => {
    e.target.style.borderColor = '#22c55e';
    e.target.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.15)';
    e.target.style.background = 'rgba(255,255,255,0.95)';
  };
  const handleBlur = (e) => {
    e.target.style.borderColor = 'rgba(16,185,129,0.2)';
    e.target.style.boxShadow = 'none';
    e.target.style.background = 'rgba(255,255,255,0.85)';
  };

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* ── Step Tabs ── */}
      <div style={{
        display: 'flex',
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '16px',
        padding: '5px',
        marginBottom: '18px',
        gap: '4px',
        border: '1px solid rgba(255,255,255,0.4)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
      }}>
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          const isActive = activeStep === idx;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStep(step.id)}
              style={{
                flex: 1,
                padding: '9px 6px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                background: isActive
                  ? 'linear-gradient(135deg, #15803d, #16a34a)'
                  : 'transparent',
                color: isActive ? '#ffffff' : '#6b7280',
                fontSize: '12px',
                fontWeight: isActive ? '700' : '500',
                transition: 'all 0.25s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                outline: 'none',
                boxShadow: isActive ? '0 4px 12px rgba(21,128,61,0.35)' : 'none',
              }}
            >
              <StepIcon size={16} />
              <span>{step.label}</span>
            </button>
          );
        })}
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          marginBottom: '16px',
          padding: '14px 18px',
          background: 'rgba(254,226,226,0.9)',
          border: '1.5px solid rgba(239,68,68,0.3)',
          borderRadius: '14px',
          color: '#991b1b',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backdropFilter: 'blur(8px)',
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

        {/* ════ STEP 0: LOCATION ════ */}
        <div style={{ display: activeStep === 0 ? 'block' : 'none' }}>
          <div style={sectionCard}>
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                boxShadow: '0 4px 12px rgba(22,163,74,0.35)',
              }}>
                <MapPin size={18} color="#fff" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#14532d' }}>
                  {t('location') || 'Location'}
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                  {t('provideYourFarmLocation') || 'Provide your farm\'s location'}
                </p>
              </div>
            </div>

            {/* Toggle: GPS / Village */}
            <div style={{
              display: 'flex',
              background: 'rgba(241,245,249,0.9)',
              borderRadius: '14px',
              padding: '4px',
              marginBottom: '20px',
              gap: '4px',
              border: '1px solid rgba(16,185,129,0.12)',
            }}>
              {[
                { value: 'gps', label: t('useGPS') || 'Use GPS', Icon: Satellite },
                { value: 'village', label: t('enterVillage') || 'Enter Village', Icon: Home }
              ].map(opt => (
                <label key={opt.value} style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                  padding: '10px',
                  borderRadius: '11px',
                  cursor: 'pointer',
                  background: formData.location.type === opt.value
                    ? 'linear-gradient(135deg, #15803d, #16a34a)'
                    : 'transparent',
                  color: formData.location.type === opt.value ? '#fff' : '#4b5563',
                  fontWeight: formData.location.type === opt.value ? '600' : '500',
                  fontSize: '13px',
                  transition: 'all 0.2s ease',
                  boxShadow: formData.location.type === opt.value
                    ? '0 4px 12px rgba(22,163,74,0.35)'
                    : 'none',
                }}>
                  <input
                    type="radio"
                    name="location_type"
                    value={opt.value}
                    checked={formData.location.type === opt.value}
                    onChange={handleInputChange}
                    style={{ display: 'none' }}
                  />
                  <opt.Icon size={14} />
                  {opt.label}
                </label>
              ))}
            </div>

            {/* GPS fields */}
            {formData.location.type === 'gps' ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
                  <div>
                    <label style={labelStyle}>
                      <Navigation size={12} /> {t('latitude') || 'Latitude'}
                    </label>
                    <input
                      type="text"
                      name="lat"
                      value={formData.location.gps.lat}
                      onChange={handleInputChange}
                      placeholder={t('enterLatitude') || 'e.g. 20.5937'}
                      style={inputBaseStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>
                      <Navigation size={12} style={{ transform: 'rotate(90deg)' }} /> {t('longitude') || 'Longitude'}
                    </label>
                    <input
                      type="text"
                      name="lng"
                      value={formData.location.gps.lng}
                      onChange={handleInputChange}
                      placeholder={t('enterLongitude') || 'e.g. 78.9629'}
                      style={inputBaseStyle}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                    />
                  </div>
                </div>

                {currentLocation && (
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={locationDetecting}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 18px',
                      background: locationDetecting
                        ? 'rgba(16,185,129,0.08)'
                        : 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(34,197,94,0.2))',
                      border: '1.5px solid rgba(16,185,129,0.3)',
                      borderRadius: '12px',
                      color: '#15803d',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: locationDetecting ? 'wait' : 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {locationDetecting
                      ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      : <MapPin size={16} />
                    }
                    {locationDetecting
                      ? (t('detectingLocation') || 'Detecting...')
                      : (t('useCurrentLocation') || 'Use My Current Location')
                    }
                  </button>
                )}
              </div>
            ) : (
              /* Village fields */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}><Landmark size={12} /> {t('villageName') || 'Village / Town'}</label>
                    <input type="text" name="village" value={formData.location.village.village}
                      onChange={handleInputChange} placeholder={t('enterVillageName') || 'Enter village or town'}
                      style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur} />
                  </div>
                  <div>
                    <label style={labelStyle}><Layers size={12} /> {t('district') || 'District'}</label>
                    <input type="text" name="district" value={formData.location.village.district}
                      onChange={handleInputChange} placeholder={t('enterDistrict') || 'Enter district'}
                      style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}><Map size={12} /> {t('state') || 'State'}</label>
                    <input type="text" name="state" value={formData.location.village.state}
                      onChange={handleInputChange} placeholder={t('enterState') || 'Enter state'}
                      style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur} />
                  </div>
                  <div>
                    <label style={labelStyle}><Globe size={12} /> {t('country') || 'Country'}</label>
                    <input type="text" name="country" value={formData.location.village.country}
                      onChange={handleInputChange} placeholder={t('enterCountry') || 'Enter country'}
                      style={inputBaseStyle} onFocus={handleFocus} onBlur={handleBlur} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}><Hash size={12} /> {t('pincode') || 'Pincode / ZIP'}</label>
                    <input type="text" name="pincode" value={formData.location.village.pincode}
                      onChange={handleInputChange} placeholder={t('enterPincode') || 'Enter pincode'}
                      style={inputBaseStyle} maxLength={10} onFocus={handleFocus} onBlur={handleBlur} />
                  </div>
                </div>
                <div style={{
                  padding: '12px 14px',
                  background: 'rgba(16,185,129,0.07)',
                  border: '1px dashed rgba(16,185,129,0.4)',
                  borderRadius: '12px',
                  fontSize: '13px',
                  color: '#166534',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}>
                  <Info size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span>{t('noteVillageLocation') || 'Location will be auto-detected using geocoding services based on the address you enter.'}</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              style={{
                padding: '12px 28px',
                background: 'linear-gradient(135deg, #15803d, #16a34a)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(22,163,74,0.4)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(22,163,74,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(22,163,74,0.4)'; }}
            >
              {t('next') || 'Next'} <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* ════ STEP 1: FARM DETAILS ════ */}
        <div style={{ display: activeStep === 1 ? 'block' : 'none' }}>
          {/* PRIMARY card — bigger + gradient border */}
          <div style={{
            ...sectionCard,
            background: 'linear-gradient(160deg, rgba(255,255,255,0.92) 0%, rgba(240,253,244,0.9) 100%)',
            border: '1.5px solid rgba(34,197,94,0.25)',
            boxShadow: '0 12px 40px rgba(22,163,74,0.12)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                boxShadow: '0 4px 12px rgba(22,163,74,0.35)',
              }}>
                <TreePine size={18} color="#fff" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#14532d' }}>
                  {t('farmDetails') || 'Farm Details'}
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                  {t('enterFarmSizeAndBudget') || 'Enter your farm size and available budget'}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Land Area */}
              <div>
                <label style={labelStyle}>
                  <Layers size={12} />
                  {t('landAreaInAcres') || 'Land Area (acres)'}
                  <span style={{ color: '#dc2626', marginLeft: '2px' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    name="land_area"
                    value={formData.land_area}
                    onChange={handleInputChange}
                    placeholder={t('enterLandArea') || 'e.g. 2.5'}
                    step="0.1"
                    min="0.1"
                    required
                    style={{ ...inputBaseStyle, paddingRight: '60px' }}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                  <span style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    color: '#6b7280', fontSize: '12px', fontWeight: '600', pointerEvents: 'none',
                  }}>acres</span>
                </div>
              </div>

              {/* Budget */}
              <div>
                <label style={labelStyle}>
                  <Wallet size={12} />
                  {t('budgetInRupees') || 'Budget (₹)'}
                  <span style={{ color: '#dc2626', marginLeft: '2px' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                    color: '#15803d', fontSize: '16px', fontWeight: '700', pointerEvents: 'none',
                  }}>₹</span>
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    placeholder={t('enterBudget') || 'e.g. 50000'}
                    min="0"
                    required
                    style={{ ...inputBaseStyle, paddingLeft: '32px' }}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
              </div>
            </div>

            {/* Investment capacity tier (STATS colored background) */}
            {formData.budget && (
              <div style={{
                marginTop: '20px',
                padding: '16px',
                background: 'rgba(16,185,129,0.06)',
                borderRadius: '14px',
                border: '1px solid rgba(16,185,129,0.15)',
              }}>
                <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Investment Capacity
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { label: 'Low', threshold: 0, max: 50000, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
                    { label: 'Medium', threshold: 50000, max: 100000, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
                    { label: 'High', threshold: 100000, max: Infinity, color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
                  ].map(tier => {
                    const val = parseFloat(formData.budget) || 0;
                    const isActive = val > tier.threshold && val <= tier.max;
                    return (
                      <div key={tier.label} style={{
                        flex: 1, padding: '10px', borderRadius: '10px', textAlign: 'center',
                        background: isActive ? tier.bg : 'rgba(0,0,0,0.03)',
                        border: `1.5px solid ${isActive ? tier.color : 'rgba(0,0,0,0.06)'}`,
                        transition: 'all 0.3s ease',
                        boxShadow: isActive ? `0 4px 12px ${tier.color}25` : 'none',
                      }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: isActive ? tier.color : '#9ca3af' }}>
                          {tier.label}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                          {tier.label === 'Low' ? '< ₹50K' : tier.label === 'Medium' ? '₹50K–1L' : '> ₹1L'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '18px' }}>
            <button
              type="button"
              onClick={() => setActiveStep(0)}
              style={{
                padding: '12px 22px',
                background: 'rgba(255,255,255,0.85)',
                color: '#374151',
                border: '1.5px solid rgba(0,0,0,0.1)',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backdropFilter: 'blur(8px)',
              }}
            >
              <ChevronLeft size={16} /> {t('back') || 'Back'}
            </button>
            <button
              type="button"
              onClick={() => setActiveStep(2)}
              style={{
                padding: '12px 28px',
                background: 'linear-gradient(135deg, #15803d, #16a34a)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(22,163,74,0.4)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
            >
              {t('next') || 'Next'} <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* ════ STEP 2: PREFERENCES ════ */}
        <div style={{ display: activeStep === 2 ? 'block' : 'none' }}>
          <div style={sectionCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                boxShadow: '0 4px 12px rgba(22,163,74,0.35)',
              }}>
                <Settings2 size={18} color="#fff" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#14532d' }}>
                  {t('preferences') || 'Preferences'}
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                  {t('optionalCropPreference') || 'Optionally specify your preferred crops'}
                </p>
              </div>
            </div>

            <div>
              <label style={labelStyle}>
                <Sprout size={12} />
                {t('cropPreference') || 'Crop Preference'}
                <span style={{ marginLeft: '6px', fontWeight: '400', textTransform: 'none', color: '#9ca3af', fontSize: '12px', letterSpacing: 0 }}>
                  ({t('optional') || 'Optional'})
                </span>
              </label>
              <input
                type="text"
                name="crop_preference"
                value={formData.crop_preference}
                onChange={handleInputChange}
                placeholder={t('enterCropPreference') || 'e.g. Rice, Wheat, Maize...'}
                style={inputBaseStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
              <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#6b7280' }}>
                {t('cropPreferenceNote') || 'Leave blank to let AI recommend the best crops based on your soil and climate conditions.'}
              </p>
            </div>

            {/* Summary card — PRIMARY gradient */}
            <div style={{
              marginTop: '20px',
              padding: '18px',
              background: 'linear-gradient(135deg, rgba(20,83,45,0.07), rgba(22,163,74,0.12))',
              borderRadius: '16px',
              border: '1.5px solid rgba(16,185,129,0.25)',
              boxShadow: '0 4px 20px rgba(22,163,74,0.08)',
            }}>
              <p style={{ margin: '0 0 14px', fontSize: '12px', fontWeight: '700', color: '#166534', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ClipboardList size={14} /> Summary
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { Icon: MapPin, label: 'Location Type', value: formData.location.type === 'gps' ? 'GPS Coordinates' : 'Village Address' },
                  { Icon: Layers, label: 'Land Area', value: formData.land_area ? `${formData.land_area} acres` : '—' },
                  { Icon: Wallet, label: 'Budget', value: formData.budget ? `₹${parseFloat(formData.budget).toLocaleString('en-IN')}` : '—' },
                  { Icon: Sprout, label: 'Crop Preference', value: formData.crop_preference || 'AI will decide' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <item.Icon size={14} style={{ color: '#16a34a', flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: '#6b7280', minWidth: '115px' }}>{item.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#14532d' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '18px', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                style={{
                  padding: '12px 22px',
                  background: 'rgba(255,255,255,0.85)',
                  color: '#374151',
                  border: '1.5px solid rgba(0,0,0,0.1)',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <ChevronLeft size={16} /> {t('back') || 'Back'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: '12px 18px',
                  background: 'rgba(255,255,255,0.85)',
                  color: '#6b7280',
                  border: '1.5px solid rgba(0,0,0,0.08)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <RotateCcw size={14} /> {t('reset') || 'Reset'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '13px 28px',
                background: loading
                  ? 'rgba(22,163,74,0.5)'
                  : 'linear-gradient(135deg, #14532d 0%, #15803d 50%, #16a34a 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '14px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(20,83,45,0.45)',
                transition: 'all 0.25s ease',
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(20,83,45,0.5)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(20,83,45,0.45)'; }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  {t('generatingPlan') || 'Generating Plan...'}
                </>
              ) : (
                <>
                  <Rocket size={17} />
                  {t('generateAgroforestryPlan') || 'Generate Plan'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Step progress indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '20px', alignItems: 'center' }}>
        {steps.map((_, idx) => (
          <div key={idx} style={{
            height: '4px',
            width: activeStep === idx ? '24px' : '8px',
            borderRadius: '4px',
            background: activeStep === idx
              ? 'linear-gradient(90deg, #16a34a, #22c55e)'
              : activeStep > idx ? '#86efac' : 'rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
          }} />
        ))}
        <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '6px' }}>
          Step {activeStep + 1} of {steps.length}
        </span>
      </div>

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default FarmerInputForm;