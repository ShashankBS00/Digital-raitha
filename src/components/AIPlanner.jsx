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

const AIPlanner = () => {
  const { t } = useTranslation();
  const [agroPlan, setAgroPlan] = useState(null);
  const [planInputs, setPlanInputs] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [climateData, setClimateData] = useState(null);
  const [climateLoading, setClimateLoading] = useState(false);
  const [climateError, setClimateError] = useState('');
  const [saveStatus, setSaveStatus] = useState(''); // '', 'saving', 'saved', 'error'
  const [planLoaded, setPlanLoaded] = useState(false);

  // Load the latest plan from Firebase on component mount
  useEffect(() => {
    const loadLatestPlan = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const savedPlan = await planStorageService.getLatestPlan(user.uid);
        if (savedPlan && savedPlan.plan) {
          setAgroPlan(savedPlan.plan);
          setPlanInputs(savedPlan.inputs || null);
          console.log('Loaded saved plan from Firebase:', savedPlan.id);
        }
      } catch (err) {
        console.error('Error loading saved plan:', err);
      } finally {
        setPlanLoaded(true);
      }
    };

    loadLatestPlan();
  }, []);

  // Handle plan generation from FarmerInputForm
  const handlePlanGenerated = async (plan, inputs) => {
    setAgroPlan(plan);
    setPlanInputs(inputs);

    // Save to Firebase. If the user is not authenticated, still persist the plan using a null user ID.
    const user = auth.currentUser;
    const userId = user ? user.uid : null;

    setSaveStatus('saving');
    try {
      await planStorageService.savePlan(userId, plan, inputs);
      setSaveStatus('saved');
      // Clear the status after 3 seconds
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      console.error('Error saving plan to Firebase:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 5000);
    }
  };

  // Reset form to collect new input
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

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return;
    }

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
          params: {
            format: 'jsonv2',
            lat: latitude,
            lon: longitude,
            'accept-language': 'en'
          }
        }),
        axios.get('https://archive-api.open-meteo.com/v1/archive', {
          params: {
            latitude,
            longitude,
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
          const city =
            address.city ||
            address.town ||
            address.village ||
            address.municipality ||
            address.county;
          const country = address.country;
          setLocationName(city && country ? `${city}, ${country}` : country || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        } else {
          setLocationName(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          setLocationError('Unable to resolve location name');
        }
        setLocationLoading(false);

        if (climateResult.status === 'fulfilled') {
          const daily = climateResult.value.data?.daily || {};
          const tempValues = (daily.temperature_2m_mean || []).filter((value) => Number.isFinite(value));
          const precipitationValues = (daily.precipitation_sum || []).filter((value) => Number.isFinite(value));
          const solarValues = (daily.shortwave_radiation_sum || []).filter((value) => Number.isFinite(value));
          const dayCount = Math.max(tempValues.length, precipitationValues.length, solarValues.length);

          if (dayCount > 0) {
            const avgTemp = average(tempValues);
            const totalRainfall = precipitationValues.reduce((sum, value) => sum + value, 0);
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

    return () => {
      cancelled = true;
    };
  }, [agroPlan, planInputs]);

  const displayedRainfall = climateData?.avg_rainfall_mm ?? agroPlan?.climate_summary?.avg_rainfall_mm ?? null;
  const displayedTemperature = climateData?.avg_temperature_c ?? agroPlan?.climate_summary?.avg_temperature_c ?? null;
  const displayedSolar =
    climateData?.solar_radiation_kwh_m2_day !== undefined && climateData?.solar_radiation_kwh_m2_day !== null
      ? `${climateData.solar_radiation_kwh_m2_day} kWh/m²/day`
      : agroPlan?.climate_summary?.solar_radiation || null;
  const farmLatitude = Number(agroPlan?.farm_location?.latitude);
  const farmLongitude = Number(agroPlan?.farm_location?.longitude);
  const displayedLatitude = Number.isFinite(farmLatitude) ? farmLatitude.toFixed(6) : 'N/A';
  const displayedLongitude = Number.isFinite(farmLongitude) ? farmLongitude.toFixed(6) : 'N/A';

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        🌱 {t('aiDrivenAgroforestryPlanner')}
      </h2>
      
      {/* Save Status Indicator */}
      {saveStatus && (
        <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
          saveStatus === 'saving' ? 'bg-blue-50 text-blue-700' :
          saveStatus === 'saved' ? 'bg-green-50 text-green-700' :
          'bg-red-50 text-red-700'
        }`}>
          {saveStatus === 'saving' && (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('savingPlan') || 'Saving plan to cloud...'}
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {t('planSaved') || 'Plan saved successfully!'}
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {t('planSaveError') || 'Could not save plan to cloud. Your plan is still available locally.'}
            </>
          )}
        </div>
      )}

      {!agroPlan ? (
        <FarmerInputForm onPlanGenerated={handlePlanGenerated} />
      ) : (
        <div className="space-y-6">
          {/* Farm Inputs Summary */}
          <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
            <h3 className="text-lg font-medium text-gray-800 mb-3">📋 {t('farmInputsSummary')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <span className="text-gray-600">{t('latitude')}:</span>
                <span className="ml-2 font-medium">{planInputs?.latitude || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">{t('longitude')}:</span>
                <span className="ml-2 font-medium">{planInputs?.longitude || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">{t('landAreaInAcres')}:</span>
                <span className="ml-2 font-medium">{planInputs?.land_area || 'N/A'} acres</span>
              </div>
              <div>
                <span className="text-gray-600">{t('budget')}:</span>
                <span className="ml-2 font-medium">
                  ₹{planInputs?.investment_capacity === 'low' ? '0-50,000' : 
                    planInputs?.investment_capacity === 'medium' ? '50,000-1,00,000' : 
                    planInputs?.investment_capacity === 'high' ? '1,00,000+' : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Farm Location */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-3">📍 {t('farmLocation')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <span className="text-gray-600">{t('latitude')}:</span>
                <span className="ml-2 font-medium break-all">{displayedLatitude}</span>
              </div>
              <div>
                <span className="text-gray-600">{t('longitude')}:</span>
                <span className="ml-2 font-medium break-all">{displayedLongitude}</span>
              </div>
              <div>
                <span className="text-gray-600">{t('location')}:</span>
                <span className="ml-2 font-medium">
                  {locationLoading ? 'Loading...' : locationName || `${displayedLatitude}, ${displayedLongitude}`}
                </span>
              </div>
              <div>
                <span className="text-gray-600">{t('elevation')}:</span>
                <span className="ml-2 font-medium">{agroPlan?.farm_location?.elevation || 'N/A'} m</span>
              </div>
            </div>
            {locationError && (
              <p className="text-sm text-amber-700 mt-3">{locationError}. Showing coordinates.</p>
            )}
          </div>
          
          {/* Soil Summary */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-3">🌍 {t('soilSummary')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><span className="text-gray-600">{t('phLevel')}:</span> <span className="font-medium">{agroPlan?.soil_summary?.ph || 'N/A'}</span></p>
                <p><span className="text-gray-600">{t('organicCarbon')}:</span> <span className="font-medium">{agroPlan?.soil_summary?.organic_carbon || 'N/A'}</span></p>
                <p><span className="text-gray-600">{t('nitrogen')}:</span> <span className="font-medium">{agroPlan?.soil_summary?.nitrogen || 'N/A'}</span></p>
                <p><span className="text-gray-600">{t('cec')}:</span> <span className="font-medium">{agroPlan?.soil_summary?.cec || 'N/A'}</span></p>
                <p><span className="text-gray-600">{t('texture')}:</span> <span className="font-medium">{agroPlan?.soil_summary?.texture || 'N/A'}</span></p>
                <p><span className="text-gray-600">{t('drainage')}:</span> <span className="font-medium">{agroPlan?.soil_summary?.drainage || 'N/A'}</span></p>
              </div>
              <div>
                <p className="text-gray-700">{agroPlan?.soil_summary?.recommendation || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          {/* Climate Summary */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-3">☀️ {t('climateSummary')}</h3>
            {climateLoading && (
              <p className="text-sm text-gray-500 mb-3">Fetching live climate data...</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p>
                  <span className="text-gray-600">{t('averageRainfall')}:</span>{' '}
                  <span className="font-medium">{displayedRainfall !== null ? `${displayedRainfall} mm` : 'N/A'}</span>
                </p>
                <p>
                  <span className="text-gray-600">{t('averageTemperature')}:</span>{' '}
                  <span className="font-medium">{displayedTemperature !== null ? `${displayedTemperature}°C` : 'N/A'}</span>
                </p>
                <p>
                  <span className="text-gray-600">{t('solarRadiation')}:</span>{' '}
                  <span className="font-medium">{displayedSolar || 'N/A'}</span>
                </p>
              </div>
              <div>
                <p className="text-gray-700">{agroPlan?.climate_summary?.recommendation || 'N/A'}</p>
                {climateError && (
                  <p className="text-sm text-amber-700 mt-2">{climateError}. Showing available plan values.</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Soil Improvement Tips */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-3">🌱 {t('soilImprovementTips')}</h3>
            <ul className="list-disc list-inside space-y-2">
              {agroPlan?.soil_improvement_tips?.map((tip, index) => (
                <li key={index} className="text-gray-700">{tip}</li>
              )) || <li className="text-gray-700">{t('loadingRecommendations')}</li>}
            </ul>
          </div>
          
          {/* Recommended Agroforestry System */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-3">🌳 {t('recommendedAgroforestrySystem')}</h3>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 mb-2">{t('trees')}</h4>
              <ul className="space-y-2">
                {agroPlan?.recommended_agroforestry_system?.trees?.map((tree, index) => (
                  <li key={index} className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                    <span className="font-medium text-green-700">{tree?.name || 'N/A'}</span>
                    <span>({tree?.spacing_m || 'N/A'}m spacing, matures in {tree?.maturity_years || 'N/A'} years)</span>
                    <span>Yield: {tree?.yield_kg_per_tree || 'N/A'} kg/tree</span>
                    <span className="text-sm text-gray-600">{tree?.benefit || 'N/A'}</span>
                  </li>
                )) || <li className="text-gray-700">{t('loadingRecommendations')}</li>}
              </ul>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 mb-2">{t('mainCrops')}</h4>
              <ul className="space-y-2">
                {agroPlan?.recommended_agroforestry_system?.main_crops?.map((crop, index) => (
                  <li key={index} className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                    <span className="font-medium text-blue-700">{crop?.name || 'N/A'}</span>
                    <span>{crop?.planting_density || 'N/A'}</span>
                    <span>{crop?.spacing || 'N/A'}</span>
                  </li>
                )) || <li className="text-gray-700">{t('loadingRecommendations')}</li>}
              </ul>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 mb-2">{t('intercrops')}</h4>
              <ul className="space-y-2">
                {agroPlan?.recommended_agroforestry_system?.intercrops?.map((crop, index) => (
                  <li key={index} className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                    <span className="font-medium text-purple-700">{crop?.name || 'N/A'}</span>
                    <span>{crop?.planting_density || 'N/A'}</span>
                    <span>{crop?.benefit || 'N/A'}</span>
                  </li>
                )) || <li className="text-gray-700">{t('loadingRecommendations')}</li>}
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 mb-2">{t('herbs')}</h4>
              <ul className="space-y-2">
                {agroPlan?.recommended_agroforestry_system?.herbs?.map((herb, index) => (
                  <li key={index} className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                    <span className="font-medium text-orange-700">{herb?.name || 'N/A'}</span>
                    <span>{herb?.planting_density || 'N/A'}</span>
                    <span>{herb?.benefit || 'N/A'}</span>
                  </li>
                )) || <li className="text-gray-700">{t('loadingRecommendations')}</li>}
              </ul>
            </div>
          </div>
          
          {/* Layout Plan */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-3">📐 {t('layoutPlan')}</h3>
            <p><span className="font-medium">{agroPlan?.layout_plan?.pattern || 'N/A'}</span> - {agroPlan?.layout_plan?.description || 'N/A'}</p>
            <p className="mt-2"><span className="text-gray-600">{t('treeSpacing')}:</span> {agroPlan?.layout_plan?.tree_spacing || 'N/A'}</p>
            <p><span className="text-gray-600">{t('cropSpacing')}:</span> {agroPlan?.layout_plan?.crop_spacing || 'N/A'}</p>
          </div>
          
          {/* Economic Projection */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-3">💰 {t('economicProjection')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-gray-600">{t('estimatedInvestment')}</p>
                <p className="text-xl font-bold text-green-700">₹{agroPlan?.economic_projection?.estimated_investment?.toLocaleString() || 'N/A'}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-gray-600">{t('expectedIncome')}</p>
                <p className="text-xl font-bold text-blue-700">₹{agroPlan?.economic_projection?.expected_income?.toLocaleString() || 'N/A'}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <p className="text-gray-600">{t('roi')}</p>
                <p className="text-xl font-bold text-purple-700">{agroPlan?.economic_projection?.roi || 'N/A'}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <p className="text-gray-600">{t('paybackPeriod')}</p>
                <p className="text-xl font-bold text-yellow-700">{agroPlan?.economic_projection?.payback_period_months || 'N/A'} {t('months')}</p>
              </div>
            </div>
            
            {/* Crop Income Breakdown */}
            <div className="mt-4">
              <h4 className="font-medium text-gray-800 mb-2">{t('incomeBreakdown')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">{t('cropIncome')}</h5>
                  <ul className="space-y-1">
                    {agroPlan?.economic_projection?.crop_income ? 
                      Object.entries(agroPlan.economic_projection.crop_income).map(([crop, income]) => (
                        <li key={crop} className="flex justify-between text-sm">
                          <span>{crop}:</span>
                          <span className="font-medium">₹{income?.toLocaleString() || 'N/A'}</span>
                        </li>
                      )) : 
                      <li className="text-gray-700">{t('loadingRecommendations')}</li>
                    }
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">{t('treeIncome')}</h5>
                  <ul className="space-y-1">
                    {agroPlan?.economic_projection?.tree_income ? 
                      Object.entries(agroPlan.economic_projection.tree_income).map(([tree, income]) => (
                        <li key={tree} className="flex justify-between text-sm">
                          <span>{tree}:</span>
                          <span className="font-medium">₹{income?.toLocaleString() || 'N/A'}</span>
                        </li>
                      )) : 
                      <li className="text-gray-700">{t('loadingRecommendations')}</li>
                    }
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* Sustainability Metrics */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-3">♻️ {t('sustainabilityMetrics')}</h3>
            <ul className="space-y-2">
              <li className="flex justify-between">
                <span className="text-gray-600">{t('soilHealthIncrease')}:</span>
                <span className="font-medium">{agroPlan?.sustainability_metrics?.soil_health_increase || 'N/A'}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">{t('waterSavings')}:</span>
                <span className="font-medium">{agroPlan?.sustainability_metrics?.water_savings || 'N/A'}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">{t('carbonSequestration')}:</span>
                <span className="font-medium">{agroPlan?.sustainability_metrics?.carbon_sequestration_potential || 'N/A'}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">{t('biodiversityScore')}:</span>
                <span className="font-medium">{agroPlan?.sustainability_metrics?.biodiversity_score || 'N/A'}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">{t('climateResilience')}:</span>
                <span className="font-medium">{agroPlan?.sustainability_metrics?.climate_resilience || 'N/A'}</span>
              </li>
            </ul>
          </div>
          
          {/* Next Steps */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-3">✅ {t('nextSteps')}</h3>
            <ol className="list-decimal list-inside space-y-2">
              {agroPlan?.next_steps?.map((step, index) => (
                <li key={index} className="text-gray-700">{step}</li>
              )) || <li className="text-gray-700">{t('loadingRecommendations')}</li>}
            </ol>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4">
            <button
              onClick={resetForm}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition duration-300"
            >
              {t('generateNewPlan')}
            </button>
            
            <button
              onClick={() => window.print()}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition duration-300"
            >
              {t('printPlan')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIPlanner;
