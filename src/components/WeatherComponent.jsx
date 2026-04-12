import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const WeatherComponent = ({ initialLat, initialLon, onWeatherFetch }) => {
  const { t } = useTranslation();
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState('');

  // Fetch weather data
  const fetchWeather = async (lat, lon) => {
    const latNum = Number(lat);
    const lonNum = Number(lon);
    const coordinateLabel = `${latNum.toFixed(4)}, ${lonNum.toFixed(4)}`;
    setWeatherLoading(true);
    setWeatherError('');

    try {
      const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
      if (!apiKey) {
        throw new Error('Missing VITE_WEATHER_API_KEY');
      }

      const response = await axios.get(
        'https://api.openweathermap.org/data/2.5/weather',
        {
          params: {
            lat,
            lon,
            units: 'metric',
            appid: apiKey
          }
        }
      );
      const data = response.data || {};
      const countryCode = data?.sys?.country;
      const countryName =
        countryCode && typeof Intl !== 'undefined' && Intl.DisplayNames
          ? new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode)
          : countryCode;
      const locationName =
        data?.name && countryName
          ? `${data.name}, ${countryName}`
          : coordinateLabel;

      const weatherData = {
        temp: data?.main?.temp ?? null,
        humidity: data?.main?.humidity ?? null,
        description: data?.weather?.[0]?.description ?? null,
        pressure: data?.main?.pressure ?? null,
        windSpeed: data?.wind?.speed ?? null,
        location: locationName,
        coordinates: coordinateLabel
      };

      setWeather(weatherData);
      onWeatherFetch?.(weatherData);
    } catch (error) {
      console.error('Error fetching weather:', error);
      const fallbackData = {
        temp: null,
        humidity: null,
        description: null,
        pressure: null,
        windSpeed: null,
        location: coordinateLabel,
        coordinates: coordinateLabel
      };
      setWeather(fallbackData);
      setWeatherError('Live weather unavailable');
      onWeatherFetch?.(fallbackData);
    } finally {
      setWeatherLoading(false);
    }
  };

  // Fetch weather when component mounts or coordinates change
  useEffect(() => {
    const latNum = Number(initialLat);
    const lonNum = Number(initialLon);
    if (Number.isFinite(latNum) && Number.isFinite(lonNum)) {
      fetchWeather(latNum, lonNum);
    }
  }, [initialLat, initialLon]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          {t('currentWeatherConditions')}
        </h2>
        {weatherLoading ? (
          <p className="text-gray-500">{t('loadingWeatherData')}</p>
        ) : weather ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center md:col-span-2 lg:col-span-2">
              <div className="text-lg font-bold text-blue-800">
                {weather.location || weather.coordinates}
              </div>
              <div className="text-gray-600">{t('location')}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-800">
                {weather.temp !== null && weather.temp !== undefined
                  ? `${Math.round(weather.temp)}°C`
                  : 'N/A'}
              </div>
              <div className="text-gray-600">{t('temperature')}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-800">
                {weather.humidity !== null && weather.humidity !== undefined
                  ? `${weather.humidity}%`
                  : 'N/A'}
              </div>
              <div className="text-gray-600">{t('humidity')}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-800">
                {weather.pressure !== null && weather.pressure !== undefined
                  ? `${weather.pressure} ${t('pressureUnit')}`
                  : 'N/A'}
              </div>
              <div className="text-gray-600">{t('pressure')}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-800">
                {weather.windSpeed !== null && weather.windSpeed !== undefined
                  ? `${weather.windSpeed} ${t('windSpeedUnit')}`
                  : 'N/A'}
              </div>
              <div className="text-gray-600">{t('windSpeed')}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center md:col-span-2 lg:col-span-2">
              <div className="text-2xl font-bold text-blue-800 capitalize">
                {weather.description
                  ? t(weather.description) || weather.description
                  : 'N/A'}
              </div>
              <div className="text-gray-600">{t('condition')}</div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">
            {weatherError || t('loadingWeatherData')}
          </p>
        )}
      </div>
    </div>
  );
};

export default WeatherComponent;
