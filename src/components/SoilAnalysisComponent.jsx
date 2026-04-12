import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import agroIntelService from '../services/agroIntelService';

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
      
      // Check if coordinates are valid
      if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
        setSoilData(null);
        setSoilLoading(false);
        return;
      }

      // Check if coordinates have changed significantly (more than 0.01 degree)
      if (
        cachedLocation.current &&
        Math.abs(cachedLocation.current.lat - latNum) < 0.01 &&
        Math.abs(cachedLocation.current.lon - lonNum) < 0.01
      ) {
        // Same location, use cached data - don't set loading
        setSoilLoading(false);
        return;
      }

      // Save current location to cache
      cachedLocation.current = { lat: latNum, lon: lonNum };
      
      setSoilLoading(true);
      setSoilError('');
      try {
        const raw = await agroIntelService.fetchSoilData(latNum, lonNum);
        // Map service response fields to display-friendly labels
        setSoilData({
          pH: raw.ph != null ? raw.ph : 'N/A',
          texture:
            raw.sand != null && raw.clay != null && raw.silt != null
              ? agroIntelService.determineSoilTexture(raw.sand, raw.silt, raw.clay)
              : 'N/A',
          organicCarbon: raw.organic_carbon != null ? `${raw.organic_carbon}%` : 'N/A',
          nitrogen: raw.nitrogen != null ? `${raw.nitrogen} kg/ha` : 'N/A',
          cec: raw.cec != null ? `${raw.cec} cmol/kg` : 'N/A',
          sand: raw.sand != null ? `${raw.sand}%` : 'N/A',
          silt: raw.silt != null ? `${raw.silt}%` : 'N/A',
          clay: raw.clay != null ? `${raw.clay}%` : 'N/A',
          _raw: raw
        });
      } catch (err) {
        console.error('Error fetching soil data:', err);
        setSoilError('Could not fetch live soil data. Showing estimated values.');
        setSoilData({
          pH: 6.8,
          texture: 'Loamy',
          organicCarbon: '1.2%',
          nitrogen: '150 kg/ha',
          cec: 'N/A',
          sand: 'N/A',
          silt: 'N/A',
          clay: 'N/A'
        });
      } finally {
        setSoilLoading(false);
      }
    };

    fetchSoilAnalysis();
  }, [lat, lon]);

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          {t('soilAnalysisReport')}
        </h2>
        {soilLoading && (
          <span className="text-sm text-blue-600 flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Fetching live soil data...
          </span>
        )}
      </div>

      {soilError && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          ⚠️ {soilError}
        </div>
      )}

      {soilLoading && !soilData ? (
        <p className="text-gray-500">{t('loadingSoilData')}</p>
      ) : soilData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Soil Properties */}
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                🌍 {t('soilProperties')}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-green-100 pb-2">
                  <span className="text-gray-600">{t('phLevel')}</span>
                  <span
                    className={`font-bold ${
                      soilData.pH !== 'N/A'
                        ? soilData.pH < 6
                          ? 'text-red-600'
                          : soilData.pH > 7.5
                          ? 'text-orange-600'
                          : 'text-green-700'
                        : 'text-gray-500'
                    }`}
                  >
                    {soilData.pH}
                  </span>
                </div>
                <div className="flex justify-between border-b border-green-100 pb-2">
                  <span className="text-gray-600">{t('texture')}</span>
                  <span className="font-medium">{soilData.texture}</span>
                </div>
                <div className="flex justify-between border-b border-green-100 pb-2">
                  <span className="text-gray-600">{t('organicCarbon')}</span>
                  <span className="font-medium">{soilData.organicCarbon}</span>
                </div>
                <div className="flex justify-between border-b border-green-100 pb-2">
                  <span className="text-gray-600">Sand / Silt / Clay</span>
                  <span className="font-medium">
                    {soilData.sand} / {soilData.silt} / {soilData.clay}
                  </span>
                </div>
                {soilData.cec !== 'N/A' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">CEC</span>
                    <span className="font-medium">{soilData.cec}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Nutrient Content */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                🧪 {t('nutrientContent')}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-blue-100 pb-2">
                  <span className="text-gray-600">{t('nitrogen')}</span>
                  <span
                    className={`font-bold ${
                      soilData._raw?.nitrogen != null && soilData._raw.nitrogen < 150
                        ? 'text-red-600'
                        : 'text-blue-700'
                    }`}
                  >
                    {soilData.nitrogen}
                  </span>
                </div>
              </div>

              {/* pH status indicator */}
              {soilData.pH !== 'N/A' && (
                <div className="mt-4 pt-3 border-t border-blue-100">
                  <p className="text-sm font-medium text-gray-700 mb-1">pH Status</p>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        soilData.pH < 6
                          ? 'bg-red-500'
                          : soilData.pH > 7.5
                          ? 'bg-orange-500'
                          : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min(((soilData.pH - 4) / 6) * 100, 100)}%`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Acidic (4)</span>
                    <span className="text-green-600 font-medium">Optimal (6–7.5)</span>
                    <span>Alkaline (10)</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Soil Management */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              🤖 {t('aiSoilManagement')}
            </h3>
            {aiRecommendations ? (
              <ul className="space-y-2">
                {aiRecommendations.soilManagement.map((rec, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-green-500 mr-2 mt-0.5">✓</span>
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">{t('loadingRecommendations')}</p>
            )}
          </div>

          <p className="text-xs text-gray-400 text-right">
            📍 Data sourced from SoilGrids API · {Number(lat).toFixed(4)}, {Number(lon).toFixed(4)}
          </p>
        </div>
      ) : (
        <p className="text-gray-500">{t('loadingSoilData')}</p>
      )}
    </div>
  );
};

export default SoilAnalysisComponent;
