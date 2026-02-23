import axios from 'axios';

// Use VITE_API_BASE_URL when set, otherwise keep relative /api paths.
const getBaseUrl = () => {
  return import.meta.env?.VITE_API_BASE_URL || '';
};

const API_BASE_URL = getBaseUrl();

// Create an axios instance with the base URL
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions
export const generateLandLayoutMap = async (mapData) => {
  try {
    const response = await apiClient.post('/api/generate-land-layout-map', mapData);
    return response.data;
  } catch (error) {
    console.error('Error generating land layout map:', error);
    throw error;
  }
};

export const getMap = async (filename) => {
  try {
    const response = await apiClient.get(`/api/get-map/${filename}`);
    return response.data;
  } catch (error) {
    console.error('Error getting map:', error);
    throw error;
  }
};

export const getLatestMap = async () => {
  try {
    const response = await apiClient.get('/api/latest-map');
    return response.data;
  } catch (error) {
    console.error('Error getting latest map:', error);
    throw error;
  }
};

// Export the apiClient for direct usage if needed
export default apiClient;
