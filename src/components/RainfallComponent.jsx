import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const RainfallComponent = ({ lat, lon, aiRecommendations }) => {
  const { t } = useTranslation();
  const [rainfallData, setRainfallData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const formatDate = (date) => date.toISOString().split('T')[0];

  const getSeasonLabel = (month) => {
    if ([6, 7, 8, 9].includes(month)) return 'Monsoon';
    if ([3, 4, 5].includes(month)) return 'Summer';
    if ([12, 1, 2].includes(month)) return 'Winter';
    return 'Other';
  };

  useEffect(() => {
    const fetchRainfall = async () => {
      const latNum = Number(lat);
      const lonNum = Number(lon);
      if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) {
        setRainfallData(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setFullYear(endDate.getFullYear() - 1);

      try {
        const response = await axios.get('https://archive-api.open-meteo.com/v1/archive', {
          params: {
            latitude: latNum,
            longitude: lonNum,
            start_date: formatDate(startDate),
            end_date: formatDate(endDate),
            daily: 'precipitation_sum',
            timezone: 'auto'
          }
        });

        const precipitation = response.data?.daily?.precipitation_sum || [];
        const time = response.data?.daily?.time || [];
        const totalRainfall = precipitation.reduce((sum, value) => sum + (Number(value) || 0), 0);

        const seasonalTotals = { Monsoon: 0, Winter: 0, Summer: 0, Other: 0 };
        time.forEach((dateString, index) => {
          const month = new Date(dateString).getMonth() + 1;
          const season = getSeasonLabel(month);
          seasonalTotals[season] += Number(precipitation[index]) || 0;
        });

        const seasonText = `Monsoon: ${Math.round(seasonalTotals.Monsoon)} mm, Winter: ${Math.round(seasonalTotals.Winter)} mm, Summer: ${Math.round(seasonalTotals.Summer)} mm`;
        const wetness = totalRainfall >= 1000 ? 'Wet' : totalRainfall >= 600 ? 'Moderate' : 'Dry';

        setRainfallData({
          annual: `${Math.round(totalRainfall)} mm`,
          seasonal: seasonText,
          soilWetness: wetness
        });
      } catch (fetchError) {
        console.error('Error fetching rainfall data:', fetchError);
        setError('Unable to fetch rainfall data. Showing estimated values.');
        setRainfallData({
          annual: '950 mm',
          seasonal: 'Monsoon: 750 mm, Winter: 150 mm, Summer: 50 mm',
          soilWetness: 'Moderate'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRainfall();
  }, [lat, lon]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          {t('rainfallAnalysis')}
        </h2>
        {loading ? (
          <p className="text-gray-500">{t('loadingRainfallData')}</p>
        ) : rainfallData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                {t('annualRainfall')}
              </h3>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {rainfallData.annual}
              </div>
              <p className="text-gray-600">{t('basedOnHistoricalData')}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                {t('seasonalDistribution')}
              </h3>
              <p className="text-gray-700">{rainfallData.seasonal}</p>
            </div>
            
            <div className="md:col-span-2 mt-4">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                {t('soilWetnessIndex')}
              </h3>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-blue-600 h-4 rounded-full"
                  style={{ width: '60%' }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-sm text-gray-600">{t('dry')}</span>
                <span className="text-sm font-medium text-gray-800">
                  {rainfallData.soilWetness}
                </span>
                <span className="text-sm text-gray-600">{t('wet')}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">{t('loadingRainfallData')}</p>
        )}
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          {t('aiIrrigationRecommendations')}
        </h2>
        {aiRecommendations ? (
          <ul className="space-y-3">
            {aiRecommendations.irrigation &&
              aiRecommendations.irrigation.map((recommendation, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-700">{recommendation}</span>
                </li>
              ))}
          </ul>
        ) : (
          <p className="text-gray-500">{t('loadingRecommendations')}</p>
        )}
      </div>
    </div>
  );
};

export default RainfallComponent;
