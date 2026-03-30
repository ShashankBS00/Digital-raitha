import axios from 'axios';
import continuousLearningService from './continuousLearningService';

// Service to integrate with free APIs for AgroIntel AI system
class AgroIntelService {
  // Fetch soil data from Kaegro Global Soil API (free, no auth required)
  async fetchSoilData(lat, lon) {
    try {
      const response = await axios.get(
        `/api/soil`,
        {
          params: { lat, lon },
          timeout: 15000
        }
      );

      const data = response.data;
      const result = {
        ph: data?.chemical?.ph_h2o ?? null,
        organic_carbon: data?.chemical?.organic_matter_pct ?? null,
        nitrogen: data?.chemical?.nitrogen_g_kg ? Math.round(data.chemical.nitrogen_g_kg * 100) : null,
        cec: data?.chemical?.cec_cmol_kg ?? null,
        sand: data?.physical?.sand_pct ?? null,
        silt: data?.physical?.silt_pct ?? null,
        clay: data?.physical?.clay_pct ?? null
      };

      // If API returned all nulls (no coverage for this location), use defaults
      if (result.ph === null && result.sand === null) {
        console.warn('Soil API returned no data for this location, using defaults');
        return { ph: 6.7, organic_carbon: 1.2, nitrogen: 150, cec: 12, sand: 45, silt: 35, clay: 20 };
      }

      return result;
    } catch (error) {
      console.error('Error fetching soil data:', error);
      return { ph: 6.7, organic_carbon: 1.2, nitrogen: 150, cec: 12, sand: 45, silt: 35, clay: 20 };
    }
  }

  // Fetch weather data from NASA POWER API
  async fetchWeatherData(lat, lon) {
    try {
      // NASA POWER API for meteorological data
      const response = await axios.get(
        `https://power.larc.nasa.gov/api/temporal/climatology/point`,
        {
          params: {
            parameters: 'T2M,RH2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN',
            community: 'AG',
            longitude: lon,
            latitude: lat,
            format: 'JSON',
            start: 2020,
            end: 2022
          }
        }
      );
      
      const data = response.data.properties.parameter;
      
      return {
        avg_temperature_c: data.T2M ? Math.round(data.T2M.ANN) : null,
        avg_humidity: data.RH2M ? Math.round(data.RH2M.ANN) : null,
        avg_rainfall_mm: data.PRECTOTCORR ? Math.round(data.PRECTOTCORR.ANN * 3650) : null, // Convert from kg/m2/s to mm/year
        solar_radiation: data.ALLSKY_SFC_SW_DWN ? Math.round(data.ALLSKY_SFC_SW_DWN.ANN) : null // Solar radiation
      };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      // Return mock data if API fails
      return {
        avg_temperature_c: 28,
        avg_humidity: 65,
        avg_rainfall_mm: 980,
        solar_radiation: 5.5
      };
    }
  }

  // Fetch elevation data from Open Elevation API
  async fetchElevation(lat, lon) {
    try {
      const response = await axios.get(
        `https://api.open-elevation.com/api/v1/lookup`,
        {
          params: {
            locations: `${lat},${lon}`
          }
        }
      );
      
      return response.data.results[0].elevation;
    } catch (error) {
      console.error('Error fetching elevation data:', error);
      return 500; // Default elevation in meters
    }
  }

  // Fetch crop market prices from Agmarknet API (mock implementation)
  async fetchCropPrices(cropList) {
    try {
      // In a real implementation, this would call the Agmarknet API
      // For now, we'll return mock prices
      const prices = {};
      cropList.forEach(crop => {
        // Generate mock prices based on crop type
        switch(crop.toLowerCase()) {
          case 'maize':
            prices[crop] = { min: 1800, max: 2200, avg: 2000 };
            break;
          case 'cowpea':
            prices[crop] = { min: 4500, max: 5500, avg: 5000 };
            break;
          case 'mango':
            prices[crop] = { min: 40, max: 60, avg: 50 };
            break;
          case 'gliricidia':
            prices[crop] = { min: 5, max: 10, avg: 7 };
            break;
          default:
            prices[crop] = { min: 2000, max: 4000, avg: 3000 };
        }
      });
      
      return prices;
    } catch (error) {
      console.error('Error fetching crop prices:', error);
      return {};
    }
  }

  // Call our AI model API to generate recommendations
  async callAIModelAPI(inputs) {
    try {
      // In a production environment, this would call your AI model API
      // For now, we'll return mock data based on the inputs
      console.log('Calling AI Model API with inputs:', inputs);
      
      // This is where you would make an HTTP request to your AI model API
      // const response = await axios.post('http://localhost:5000/recommend', inputs);
      // return response.data;
      
      // For now, return mock data
      return this.generateMockRecommendation(inputs);
    } catch (error) {
      console.error('Error calling AI model API:', error);
      // Fallback to rule-based generation
      return this.generateAgroforestryPlan(inputs);
    }
  }

  // Fetch real-time predictions from our ML models
  async fetchRealTimePredictions(farmerData) {
    // Generate a local fallback prediction ID in case Firebase is unavailable
    const fallbackPredictionId = `local-pred-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // In a production environment, this would call your AI model API
      console.log('Fetching real-time predictions with farmer data:', farmerData);
      
      // Make API call to our prediction service
      const response = await axios.post('http://localhost:5000/predict/realtime', farmerData);
      
      // Always set a prediction_id even if Firebase fails
      response.data.prediction_id = fallbackPredictionId;
      
      // Try to store the prediction in Firebase for continuous learning
      try {
        const predictionId = await continuousLearningService.storePrediction({
          farmer_data: farmerData,
          predictions: response.data.predictions,
          weather_data: response.data.weather_data,
          recommendations: response.data.recommendations,
          timestamp: new Date().toISOString()
        });
        console.log('Prediction stored in Firebase with ID:', predictionId);
        response.data.prediction_id = predictionId;
      } catch (storageError) {
        console.warn('Firebase storage unavailable, using local prediction ID:', storageError.message);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching real-time predictions:', error);
      // Return mock data if API fails — always include prediction_id
      return {
        prediction_id: fallbackPredictionId,
        predictions: {
          yield_kg_per_acre: 3000,
          roi: 2.8,
          confidence: 0.85
        },
        weather_data: {
          avg_temperature_c: 28,
          avg_humidity: 65,
          avg_rainfall_mm: 980,
          solar_radiation: 5.5
        },
        recommendations: {
          best_crop: "Maize",
          planting_time: "June-July",
          irrigation_needs: "Moderate"
        }
      };
    }
  }

  // Generate mock recommendation (to be replaced with actual AI model API call)
  generateMockRecommendation(inputs) {
    const { 
      latitude, 
      longitude, 
      soil_pH, 
      organic_carbon,
      nitrogen,
      cec,
      sand, 
      clay, 
      silt,
      avg_rainfall_mm,
      avg_temperature_c,
      solar_radiation,
      land_area,
      investment_capacity
    } = inputs;
    
    // Determine soil texture based on sand/silt/clay percentages
    const soilTexture = this.determineSoilTexture(sand, silt, clay);
    
    // Determine soil drainage based on texture
    const drainageQuality = this.determineDrainageQuality(soilTexture, clay);
    
    // Determine region to use region-specific crops
    const region = this.determineRegion(latitude, longitude);
    
    // Determine suitable crops based on region, soil and climate
    const suitableCrops = this.determineSuitableCrops(soil_pH, avg_rainfall_mm, avg_temperature_c, nitrogen, region);
    
    // Determine suitable trees based on region, climate and soil
    const suitableTrees = this.determineSuitableTrees(avg_rainfall_mm, avg_temperature_c, soil_pH, drainageQuality, region);
    
    // Calculate estimated investment and returns
    const economicProjection = this.calculateEconomicProjection(land_area, investment_capacity, suitableCrops, suitableTrees);
    
    // Generate spatial layout
    const layoutPlan = this.generateLayoutPlan(soilTexture, avg_rainfall_mm);
    
    // Get crop prices for economic analysis
    const cropList = [
      ...suitableCrops.mainCrops.map(c => c.name),
      ...suitableCrops.intercrops.map(c => c.name),
      ...suitableTrees.map(t => t.name)
    ];
    
    // Generate sustainability metrics
    const sustainabilityMetrics = this.calculateSustainabilityMetrics(soilTexture, organic_carbon, avg_rainfall_mm);
    
    // Generate soil improvement recommendations
    const soilImprovementTips = this.generateSoilImprovementTips(soil_pH, organic_carbon, nitrogen, cec);
    
    return {
      farm_location: {
        latitude: latitude,
        longitude: longitude,
        region: region,
        elevation: 500 // Mock elevation
      },
      soil_summary: {
        ph: soil_pH ?? 'N/A',
        organic_carbon: organic_carbon != null ? `${organic_carbon}%` : 'N/A',
        nitrogen: nitrogen != null ? `${nitrogen} kg/ha` : 'N/A',
        cec: cec != null ? `${cec} cmol/kg` : 'N/A',
        texture: soilTexture || 'N/A',
        drainage: drainageQuality || 'N/A',
        recommendation: this.getSoilRecommendation(soil_pH, organic_carbon, soilTexture, nitrogen, cec)
      },
      climate_summary: {
        avg_rainfall_mm: avg_rainfall_mm,
        avg_temperature_c: avg_temperature_c,
        solar_radiation: `${solar_radiation} kWh/m²/day`,
        recommendation: this.getClimateRecommendation(avg_rainfall_mm, avg_temperature_c, solar_radiation)
      },
      recommended_agroforestry_system: {
        trees: suitableTrees,
        main_crops: suitableCrops.mainCrops,
        intercrops: suitableCrops.intercrops,
        herbs: suitableCrops.herbs
      },
      layout_plan: layoutPlan,
      economic_projection: economicProjection,
      sustainability_metrics: sustainabilityMetrics,
      soil_improvement_tips: soilImprovementTips,
      next_steps: [
        "Prepare nursery of selected trees",
        "Install drip irrigation (low cost)",
        "Plant nitrogen-fixing crops first",
        "Add organic compost before sowing"
      ]
    };
  }

  // Generate AI-driven agroforestry plan based on inputs
  async generateAgroforestryPlan(inputs) {
    // Call our AI model API
    try {
      const recommendation = await this.callAIModelAPI(inputs);
      return recommendation;
    } catch (error) {
      console.error('Error generating agroforestry plan:', error);
      // Fallback to rule-based generation if AI model fails
      return this.generateRuleBasedPlan(inputs);
    }
  }
  
  // Fallback rule-based plan generation
  generateRuleBasedPlan(inputs) {
    const { 
      latitude, 
      longitude, 
      soil_pH, 
      organic_carbon,
      nitrogen,
      cec,
      sand, 
      clay, 
      silt,
      avg_rainfall_mm,
      avg_temperature_c,
      solar_radiation,
      land_area,
      investment_capacity
    } = inputs;
    
    // Determine soil texture based on sand/silt/clay percentages
    const soilTexture = this.determineSoilTexture(sand, silt, clay);
    
    // Determine soil drainage based on texture
    const drainageQuality = this.determineDrainageQuality(soilTexture, clay);
    
    // Determine region to use region-specific crops
    const region = this.determineRegion(latitude, longitude);
    
    // Determine suitable crops based on region, soil and climate
    const suitableCrops = this.determineSuitableCrops(soil_pH, avg_rainfall_mm, avg_temperature_c, nitrogen, region);
    
    // Determine suitable trees based on region, climate and soil
    const suitableTrees = this.determineSuitableTrees(avg_rainfall_mm, avg_temperature_c, soil_pH, drainageQuality, region);
    
    // Calculate estimated investment and returns
    const economicProjection = this.calculateEconomicProjection(land_area, investment_capacity, suitableCrops, suitableTrees);
    
    // Generate spatial layout
    const layoutPlan = this.generateLayoutPlan(soilTexture, avg_rainfall_mm);
    
    // Get crop prices for economic analysis
    const cropList = [
      ...suitableCrops.mainCrops.map(c => c.name),
      ...suitableCrops.intercrops.map(c => c.name),
      ...suitableTrees.map(t => t.name)
    ];
    
    const cropPrices = {}; // Mock crop prices
    
    // Generate sustainability metrics
    const sustainabilityMetrics = this.calculateSustainabilityMetrics(soilTexture, organic_carbon, avg_rainfall_mm);
    
    // Generate soil improvement recommendations
    const soilImprovementTips = this.generateSoilImprovementTips(soil_pH, organic_carbon, nitrogen, cec);
    
    return {
      farm_location: {
        latitude: latitude,
        longitude: longitude,
        region: this.determineRegion(latitude, longitude),
        elevation: 500 // Mock elevation
      },
      soil_summary: {
        ph: soil_pH ?? 'N/A',
        organic_carbon: organic_carbon != null ? `${organic_carbon}%` : 'N/A',
        nitrogen: nitrogen != null ? `${nitrogen} kg/ha` : 'N/A',
        cec: cec != null ? `${cec} cmol/kg` : 'N/A',
        texture: soilTexture || 'N/A',
        drainage: drainageQuality || 'N/A',
        recommendation: this.getSoilRecommendation(soil_pH, organic_carbon, soilTexture, nitrogen, cec)
      },
      climate_summary: {
        avg_rainfall_mm: avg_rainfall_mm,
        avg_temperature_c: avg_temperature_c,
        solar_radiation: `${solar_radiation} kWh/m²/day`,
        recommendation: this.getClimateRecommendation(avg_rainfall_mm, avg_temperature_c, solar_radiation)
      },
      recommended_agroforestry_system: {
        trees: suitableTrees,
        main_crops: suitableCrops.mainCrops,
        intercrops: suitableCrops.intercrops,
        herbs: suitableCrops.herbs
      },
      layout_plan: layoutPlan,
      economic_projection: {
        ...economicProjection,
        crop_prices: cropPrices
      },
      sustainability_metrics: sustainabilityMetrics,
      soil_improvement_tips: soilImprovementTips,
      next_steps: [
        "Prepare nursery of selected trees",
        "Install drip irrigation (low cost)",
        "Plant nitrogen-fixing crops first",
        "Add organic compost before sowing"
      ]
    };
  }
  
  // Helper methods for plan generation
  determineSoilTexture(sand, silt, clay) {
    if (sand && silt && clay) {
      if (sand > 70) return "Sandy";
      if (clay > 40) return "Clay";
      if (silt > 40) return "Silty";
      return "Loamy";
    }
    return "Loamy"; // Default
  }
  
  determineDrainageQuality(texture, clay) {
    if (texture === "Sandy") return "Well Drained";
    if (texture === "Clay" || clay > 40) return "Poorly Drained";
    return "Moderately Drained";
  }
  
  determineSuitableCrops(ph, rainfall, temperature, nitrogen, region = "India") {
    const mainCrops = [];
    const intercrops = [];
    const herbs = [];
    
    // Use safe defaults for null values
    const safePh = ph ?? 6.5;
    const safeRainfall = rainfall ?? 800;
    const safeTemp = temperature ?? 28;
    const safeNitrogen = nitrogen ?? 150;
    
    // Get region-specific crop database
    const regionalCropDB = this.getRegionalCropDatabase();
    const regionCrops = regionalCropDB[region] || regionalCropDB["India"];
    
    // Main crops - use regional recommendations, scored by climate compatibility
    const scoredCrops = [];
    
    if (regionCrops.mainCrops) {
      for (const cropName of regionCrops.mainCrops) {
        const cropData = this.getCropClimateRequirements(cropName);
        
        // Score: 3 = all match, 2 = 2 of 3 match, etc.
        let score = 0;
        if (safePh >= cropData.ph_min && safePh <= cropData.ph_max) score++;
        if (safeRainfall >= cropData.rainfall_min && safeRainfall <= cropData.rainfall_max) score++;
        if (safeTemp >= cropData.temp_min && safeTemp <= cropData.temp_max) score++;
        
        scoredCrops.push({
          name: cropName, 
          planting_density: cropData.planting_density || this.getCropPlantingDensity(cropName), 
          spacing: cropData.spacing || "As recommended",
          suitability: score === 3 ? "Highly Recommended for your region" : 
                       score >= 2 ? "Recommended for your region" : "Suitable for your region",
          score
        });
      }
    }
    
    // Sort by climate compatibility, take top 2
    scoredCrops.sort((a, b) => b.score - a.score);
    mainCrops.push(...scoredCrops.slice(0, 2));
    
    // Intercrops - add up to 2 region-specific intercrops
    if (regionCrops.intercrops) {
      const addedIntercrops = new Set();
      
      // If nitrogen is low, prioritize nitrogen-fixing intercrops
      if (safeNitrogen < 200) {
        const nitrogenFixers = ["Cowpea", "Pigeonpea", "Green Gram", "Black Gram", "Groundnut", 
                                "Soyabean", "Chickpea", "Lentils", "Peas", "Arhar"];
        for (const cropName of regionCrops.intercrops) {
          if (nitrogenFixers.includes(cropName) && !addedIntercrops.has(cropName)) {
            intercrops.push({
              name: cropName, 
              planting_density: this.getCropPlantingDensity(cropName),
              benefit: this.getCropBenefit(cropName)
            });
            addedIntercrops.add(cropName);
            break;
          }
        }
      }
      
      // Add remaining intercrops (up to total of 2)
      for (const cropName of regionCrops.intercrops) {
        if (intercrops.length >= 2) break;
        if (addedIntercrops.has(cropName)) continue;
        intercrops.push({
          name: cropName, 
          planting_density: this.getCropPlantingDensity(cropName),
          benefit: this.getCropBenefit(cropName)
        });
        addedIntercrops.add(cropName);
      }
    }
    
    // Herbs - region-specific with temperature consideration
    const regionHerbs = {
      "Punjab/Haryana": ["Coriander", "Methi (Fenugreek)"],
      "Rajasthan": ["Fenugreek", "Cumin"],
      "Uttar Pradesh": ["Coriander", "Mint"],
      "Bihar": ["Turmeric", "Ginger"],
      "Jharkhand": ["Turmeric", "Lac crop"],
      "Madhya Pradesh": ["Turmeric", "Coriander"],
      "Maharashtra": ["Turmeric", "Safflower"],
      "Chhattisgarh": ["Turmeric", "Ginger"],
      "Karnataka": ["Turmeric", "Cardamom"],
      "Telangana": ["Turmeric", "Chilli"],
      "Andhra Pradesh": ["Ginger", "Chilli"],
      "Tamil Nadu": ["Turmeric", "Curry Leaf"],
      "Kerala": ["Cardamom", "Black Pepper"],
      "West Bengal": ["Ginger", "Turmeric"],
      "Gujarat": ["Cumin", "Fennel"],
      "Odisha": ["Turmeric", "Ginger"],
      "Assam/Northeast": ["Ginger", "Turmeric"]
    };
    const herbChoices = regionHerbs[region] || ["Turmeric"];
    
    if (safeTemp >= 20 && safeTemp <= 35) {
      herbs.push({
        name: herbChoices[0], 
        planting_density: this.getCropPlantingDensity(herbChoices[0]),
        benefit: `High value spice crop for ${region}`
      });
    } else if (safeTemp >= 15 && safeTemp < 20 && herbChoices.length > 1) {
      herbs.push({
        name: herbChoices[1], 
        planting_density: this.getCropPlantingDensity(herbChoices[1]),
        benefit: `Cool season herb suitable for ${region}`
      });
    }
    
    // Fallback crops if none match
    if (mainCrops.length === 0) {
      mainCrops.push({name: "Maize", planting_density: "50,000 plants/ha", spacing: "75cm rows"});
    }
    
    if (intercrops.length === 0) {
      intercrops.push({name: "Cowpea", planting_density: "40,000 plants/ha", benefit: "Nitrogen fixation"});
    }
    
    if (herbs.length === 0) {
      herbs.push({name: "Turmeric", planting_density: "125,000 rhizomes/ha", benefit: "High value spice"});
    }
    
    return { mainCrops, intercrops, herbs };
  }
  
  // Helper methods for crop data
  getCropClimateRequirements(cropName) {
    const cropRequirements = {
      "Wheat": { ph_min: 6.0, ph_max: 7.5, rainfall_min: 400, rainfall_max: 800, temp_min: 10, temp_max: 25 },
      "Rice": { ph_min: 5.0, ph_max: 8.5, rainfall_min: 800, rainfall_max: 1500, temp_min: 20, temp_max: 35 },
      "Maize": { ph_min: 6.0, ph_max: 7.5, rainfall_min: 600, rainfall_max: 1200, temp_min: 20, temp_max: 35 },
      "Cotton": { ph_min: 6.0, ph_max: 8.0, rainfall_min: 600, rainfall_max: 1200, temp_min: 20, temp_max: 35 },
      "Soyabean": { ph_min: 6.0, ph_max: 7.5, rainfall_min: 600, rainfall_max: 1100, temp_min: 20, temp_max: 30 },
      "Pigeonpea": { ph_min: 5.5, ph_max: 8.0, rainfall_min: 600, rainfall_max: 1200, temp_min: 20, temp_max: 35 },
      "Chickpea": { ph_min: 7.0, ph_max: 8.0, rainfall_min: 400, rainfall_max: 800, temp_min: 15, temp_max: 30 },
      "Groundnut": { ph_min: 6.0, ph_max: 8.0, rainfall_min: 500, rainfall_max: 1000, temp_min: 20, temp_max: 35 },
      "Jowar": { ph_min: 6.0, ph_max: 8.0, rainfall_min: 400, rainfall_max: 900, temp_min: 20, temp_max: 35 },
      "Pearl Millet": { ph_min: 6.0, ph_max: 8.0, rainfall_min: 300, rainfall_max: 700, temp_min: 20, temp_max: 35 },
      "Coconut": { ph_min: 5.5, ph_max: 8.0, rainfall_min: 800, rainfall_max: 3000, temp_min: 20, temp_max: 35 },
      "Sugarcane": { ph_min: 6.5, ph_max: 8.0, rainfall_min: 1200, rainfall_max: 2250, temp_min: 20, temp_max: 30 },
      "Turmeric": { ph_min: 5.5, ph_max: 7.5, rainfall_min: 1200, rainfall_max: 2250, temp_min: 20, temp_max: 30 }
    };
    
    return cropRequirements[cropName] || { ph_min: 6.0, ph_max: 7.5, rainfall_min: 600, rainfall_max: 1200, temp_min: 20, temp_max: 35 };
  }
  
  getCropPlantingDensity(cropName) {
    const densities = {
      "Maize": "50,000 plants/ha",
      "Cowpea": "40,000 plants/ha",
      "Chickpea": "40,000 plants/ha",
      "Lentils": "30,000 plants/ha",
      "Groundnut": "50,000 plants/ha",
      "Soyabean": "60,000 plants/ha",
      "Turmeric": "125,000 rhizomes/ha",
      "Ginger": "100,000 rhizomes/ha",
      "Pigeonpea": "60,000 plants/ha",
      "Jowar": "50,000 plants/ha",
      "Cotton": "55,000 plants/ha",
      "Rice": "50,000 plants/ha",
      "Pearl Millet": "45,000 plants/ha",
      "Wheat": "100 kg seed/ha",
      "Sugarcane": "40,000 setts/ha",
      "Coconut": "175 palms/ha",
      "Black Gram": "40,000 plants/ha",
      "Green Gram": "40,000 plants/ha",
      "Peas": "35,000 plants/ha",
      "Mustard": "30,000 plants/ha",
      "Coriander": "500,000 plants/ha",
      "Methi (Fenugreek)": "400,000 plants/ha",
      "Fenugreek": "400,000 plants/ha",
      "Cumin": "300,000 plants/ha",
      "Mint": "80,000 plants/ha",
      "Cardamom": "2,000 plants/ha",
      "Black Pepper": "2,500 vines/ha",
      "Fennel": "200,000 plants/ha",
      "Curry Leaf": "10,000 plants/ha",
      "Chilli": "60,000 plants/ha",
      "Safflower": "50,000 plants/ha",
      "Lac crop": "Lac host trees/ha"
    };
    return densities[cropName] || "60,000 plants/ha";
  }
  
  getCropBenefit(cropName) {
    const benefits = {
      "Cowpea": "Nitrogen fixation",
      "Lentils": "Protein source, nitrogen fixation",
      "Chickpea": "Protein source",
      "Pigeonpea": "Nitrogen fixation, protein",
      "Black Gram": "Protein source",
      "Green Gram": "Nitrogen fixation",
      "Groundnut": "Oil crop, nitrogen fixation",
      "Soyabean": "Protein source"
    };
    return benefits[cropName] || "Improves soil health";
  }
  
  determineSuitableTrees(rainfall, temperature, ph, drainage, region = "India") {
    const trees = [];
    
    // Use safe defaults for null values
    const safePh = ph ?? 6.5;
    const safeRainfall = rainfall ?? 800;
    const safeTemp = temperature ?? 28;
    
    // Get region-specific tree database
    const regionalCropDB = this.getRegionalCropDatabase();
    const regionTrees = regionalCropDB[region]?.trees || ["Neem", "Mango", "Gliricidia"];
    
    // Regional specific tree variations
    const regionalTreeDetails = {
      "Mango": {
        conditions: (r, t, p) => r > 800 && t > 25 && p >= 5.5 && p <= 7.5,
        spacing_m: "10x10",
        yield_kg: 200,
        maturity: 4,
        benefit: "Fruit production, shade, income diversification"
      },
      "Gliricidia": {
        conditions: (r, t, p) => p >= 5.0 && p <= 8.0 && drainage !== "Poorly Drained",
        spacing_m: "2x2",
        yield_kg: 15,
        maturity: 2,
        benefit: "Nitrogen fixer, soil protector, fodder"
      },
      "Neem": {
        conditions: (r, t, p) => r > 600 && t >= 20 && t <= 35,
        spacing_m: "8x8",
        yield_kg: 5,
        maturity: 3,
        benefit: "Multipurpose tree for pest control and shade"
      },
      "Coconut": {
        conditions: (r, t, p) => r > 1200 && t > 20,
        spacing_m: "7x7",
        yield_kg: 100,
        maturity: 5,
        benefit: "Fruit and coconut production, high value"
      },
      "Teak": {
        conditions: (r, t, p) => r > 1000 && t >= 20,
        spacing_m: "3x3",
        yield_kg: 50,
        maturity: 8,
        benefit: "Timber production, valuable wood"
      },
      "Bamboo": {
        conditions: (r, t, p) => r > 1000,
        spacing_m: "2x2",
        yield_kg: 25,
        maturity: 3,
        benefit: "Fast-growing, versatile, carbon sequestration"
      },
      "Tamarind": {
        conditions: (r, t, p) => r > 600 && t > 20,
        spacing_m: "10x10",
        yield_kg: 20,
        maturity: 5,
        benefit: "Fruit production, shade, soil improvement"
      },
      "Poplar": {
        conditions: (r, t, p) => r > 400 && t > 10,
        spacing_m: "5x5",
        yield_kg: 40,
        maturity: 5,
        benefit: "Fast-growing timber, firewood"
      },
      "Sal": {
        conditions: (r, t, p) => r > 900 && t > 20,
        spacing_m: "5x5",
        yield_kg: 30,
        maturity: 6,
        benefit: "Timber, cultural significance"
      }
    };
    
    // Add trees that are suitable for the region and climate
    for (const treeName of regionTrees) {
      const treeDetails = regionalTreeDetails[treeName];
      if (treeDetails && treeDetails.conditions(safeRainfall, safeTemp, safePh)) {
        trees.push({
          name: treeName,
          spacing_m: treeDetails.spacing_m,
          yield_kg_per_tree: treeDetails.yield_kg,
          maturity_years: treeDetails.maturity,
          benefit: treeDetails.benefit,
          region_specific: true
        });
      }
    }
    
    // Add additional trees based on climate if not enough from regional list
    const additionalTrees = ["Neem", "Gliricidia", "Tamarind", "Bamboo"];
    for (const treeName of additionalTrees) {
      if (trees.length >= 2) break;
      if (trees.some(t => t.name === treeName)) continue;
      
      const treeDetails = regionalTreeDetails[treeName];
      if (treeDetails && treeDetails.conditions(safeRainfall, safeTemp, safePh)) {
        trees.push({
          name: treeName,
          spacing_m: treeDetails.spacing_m,
          yield_kg_per_tree: treeDetails.yield_kg,
          maturity_years: treeDetails.maturity,
          benefit: treeDetails.benefit,
          region_specific: false
        });
      }
    }
    
    // Fallback trees if none match
    if (trees.length === 0) {
      trees.push({
        name: "Subabul (Leucaena)",
        spacing_m: "3x3",
        yield_kg_per_tree: 10,
        maturity_years: 2,
        benefit: "Nitrogen fixer, fodder, biomass",
        region_specific: false
      });
    }
    
    return trees;
  }
  
  calculateEconomicProjection(land_area, investment_capacity, crops, trees) {
    // Simplified economic calculation
    let estimated_investment = 0;
    let expected_income = 0;
    
    switch(investment_capacity) {
      case 'low':
        estimated_investment = 20000;
        expected_income = 60000;
        break;
      case 'medium':
        estimated_investment = 35000;
        expected_income = 120000;
        break;
      case 'high':
        estimated_investment = 60000;
        expected_income = 200000;
        break;
      default:
        estimated_investment = 35000;
        expected_income = 120000;
    }
    
    const roi = (expected_income / estimated_investment).toFixed(1) + "x";
    const payback_period_months = Math.round(estimated_investment / (expected_income / 12));
    
    // Calculate per crop/tree income (simplified)
    const cropIncome = {};
    crops.mainCrops.forEach(crop => {
      cropIncome[crop.name] = Math.round(expected_income * 0.4);
    });
    
    crops.intercrops.forEach(crop => {
      cropIncome[crop.name] = Math.round(expected_income * 0.2);
    });
    
    const treeIncome = {};
    trees.forEach(tree => {
      treeIncome[tree.name] = Math.round(expected_income * 0.4);
    });
    
    return {
      estimated_investment,
      expected_income,
      roi,
      payback_period_months,
      crop_income: cropIncome,
      tree_income: treeIncome
    };
  }
  
  generateLayoutPlan(soilTexture, rainfall) {
    let pattern = "Alley Cropping";
    let description = "Alternate rows of trees and mixed crops (5m spacing)";
    
    if (soilTexture === "Sandy" && rainfall < 600) {
      pattern = "Boundary Planting";
      description = "Plant trees along boundaries with drought-resistant crops in center";
    } else if (rainfall > 1200) {
      pattern = "Multistorey System";
      description = "Multiple layers of trees, shrubs, and crops for high rainfall areas";
    }
    
    return {
      pattern: pattern,
      description: description,
      tree_spacing: "5-10m depending on species",
      crop_spacing: "As per crop recommendations"
    };
  }
  
  calculateSustainabilityMetrics(soilTexture, organicCarbon, rainfall) {
    // Calculate sustainability metrics based on inputs
    let soilHealthIncrease = "+10-15%";
    let waterSavings = "15-20%";
    let carbonSequestration = "1.0-1.5 tons/ha/year";
    
    // Adjust based on soil quality
    if (organicCarbon > 1.5) {
      soilHealthIncrease = "+15-20%";
      carbonSequestration = "1.5-2.0 tons/ha/year";
    }
    
    // Adjust based on rainfall
    if (rainfall > 1000) {
      waterSavings = "20-25%";
    } else if (rainfall < 500) {
      waterSavings = "10-15%";
    }
    
    return {
      soil_health_increase: soilHealthIncrease,
      water_savings: waterSavings,
      carbon_sequestration_potential: carbonSequestration,
      biodiversity_score: "High",
      climate_resilience: "Improved"
    };
  }
  
  generateSoilImprovementTips(ph, organicCarbon, nitrogen, cec) {
    const tips = [];
    
    if (ph != null && ph < 6.0) {
      tips.push("Soil is acidic. Add lime (calcium carbonate) to raise pH. Apply 1-2 tons/ha based on current pH.");
    } else if (ph != null && ph > 7.5) {
      tips.push("Soil is alkaline. Add organic matter like compost to lower pH. Apply 5-10 tons/ha of well-decomposed compost.");
    }
    
    if (organicCarbon != null && organicCarbon < 1.0) {
      tips.push("Low organic matter. Add compost or farmyard manure. Apply 5-10 tons/ha annually.");
    }
    
    if (nitrogen != null && nitrogen < 150) {
      tips.push("Low nitrogen content. Plant nitrogen-fixing crops like legumes. Apply neem cake @ 100 kg/ha.");
    }
    
    if (cec != null && cec < 10) {
      tips.push("Low cation exchange capacity. Add organic matter to improve soil structure and nutrient retention.");
    }
    
    tips.push("Practice crop rotation with legumes to maintain soil fertility.");
    tips.push("Use mulching to conserve moisture and add organic matter.");
    
    return tips;
  }
  
  determineRegion(lat, lon) {
    // Identify Indian states/regions based on non-overlapping coordinate ranges
    // Check if within India's bounding box first
    if (lat < 8 || lat > 37 || lon < 68 || lon > 97) {
      return "Global";
    }
    
    // --- Northeast India ---
    if (lat > 24 && lon > 89) return "Assam/Northeast";
    
    // --- Northern India (lat > 28) ---
    if (lat > 28) {
      if (lon < 78) return "Punjab/Haryana";
      if (lon >= 78 && lon < 82) return "Uttar Pradesh";
      // Himalayan / Northern UP / Uttarakhand - treat as UP for crops
      return "Uttar Pradesh";
    }
    
    // --- Upper-Central Belt (lat 25-28) ---
    if (lat > 25 && lat <= 28) {
      if (lon < 76) return "Rajasthan";
      if (lon >= 76 && lon < 84) return "Uttar Pradesh";
      if (lon >= 84 && lon < 87) return "Bihar";
      if (lon >= 87 && lon < 89) return "West Bengal";
      return "Assam/Northeast";
    }
    
    // --- Central Belt (lat 22-25) ---
    if (lat > 22 && lat <= 25) {
      if (lon < 73) return "Gujarat";
      if (lon >= 73 && lon < 76) return "Rajasthan";
      if (lon >= 76 && lon < 80) return "Madhya Pradesh";
      if (lon >= 80 && lon < 84) return "Chhattisgarh";
      if (lon >= 84 && lon < 87) return "Jharkhand";
      if (lon >= 87 && lon < 89) return "West Bengal";
      return "Odisha";
    }
    
    // --- Lower-Central Belt (lat 19-22) ---
    if (lat > 19 && lat <= 22) {
      if (lon < 73) return "Gujarat";
      if (lon >= 73 && lon < 77) return "Maharashtra";
      if (lon >= 77 && lon < 80) return "Maharashtra";
      if (lon >= 80 && lon < 84) return "Chhattisgarh";
      if (lon >= 84) return "Odisha";
      return "Maharashtra";
    }
    
    // --- Deccan Plateau (lat 15-19) ---
    if (lat > 15 && lat <= 19) {
      if (lon < 74) return "Maharashtra";
      if (lon >= 74 && lon < 77) return "Karnataka";
      if (lon >= 77 && lon < 79) return "Telangana";
      if (lon >= 79 && lon < 81) return "Andhra Pradesh";
      if (lon >= 81) return "Andhra Pradesh";
      return "Telangana";
    }
    
    // --- South India (lat 12-15) ---
    if (lat > 12 && lat <= 15) {
      if (lon < 75) return "Karnataka";
      if (lon >= 75 && lon < 77) return "Karnataka";
      if (lon >= 77 && lon < 79) return "Andhra Pradesh";
      if (lon >= 79) return "Andhra Pradesh";
      return "Karnataka";
    }
    
    // --- Deep South (lat 8-12) ---
    if (lat > 8 && lat <= 12) {
      if (lon < 76) return "Kerala";
      if (lon >= 76 && lon < 78) return "Tamil Nadu";
      if (lon >= 78) return "Tamil Nadu";
      return "Tamil Nadu";
    }
    
    return "India";
  }
  
  // Regional crop database for better recommendations
  getRegionalCropDatabase() {
    return {
      "Punjab/Haryana": {
        mainCrops: ["Wheat", "Rice", "Maize", "Cotton"],
        intercrops: ["Peas", "Mustard", "Lentils"],
        trees: ["Poplar", "Neem", "Mango"]
      },
      "Uttar Pradesh": {
        mainCrops: ["Wheat", "Rice", "Sugarcane", "Maize"],
        intercrops: ["Pigeonpea", "Lentils", "Chickpea"],
        trees: ["Mango", "Neem", "Teak"]
      },
      "Rajasthan": {
        mainCrops: ["Pearl Millet", "Jowar", "Maize", "Groundnut"],
        intercrops: ["Chickpea", "Cowpea", "Groundnut"],
        trees: ["Neem", "Tamarind", "Gliricidia"]
      },
      "Bihar": {
        mainCrops: ["Rice", "Wheat", "Maize", "Sugarcane"],
        intercrops: ["Lentils", "Chickpea", "Cowpea"],
        trees: ["Mango", "Bamboo", "Neem"]
      },
      "Jharkhand": {
        mainCrops: ["Rice", "Maize", "Jowar", "Groundnut"],
        intercrops: ["Pigeonpea", "Black Gram", "Cowpea"],
        trees: ["Sal", "Bamboo", "Mango"]
      },
      "Madhya Pradesh": {
        mainCrops: ["Soyabean", "Wheat", "Chickpea", "Cotton"],
        intercrops: ["Pigeonpea", "Lentils", "Black Gram"],
        trees: ["Teak", "Neem", "Mango"]
      },
      "Maharashtra": {
        mainCrops: ["Cotton", "Soyabean", "Jowar", "Sugarcane"],
        intercrops: ["Pigeonpea", "Groundnut", "Green Gram"],
        trees: ["Teak", "Mango", "Tamarind"]
      },
      "Gujarat": {
        mainCrops: ["Cotton", "Groundnut", "Pearl Millet", "Maize"],
        intercrops: ["Pigeonpea", "Soyabean", "Cowpea"],
        trees: ["Neem", "Mango", "Tamarind"]
      },
      "Chhattisgarh": {
        mainCrops: ["Rice", "Maize", "Jowar", "Soyabean"],
        intercrops: ["Chickpea", "Pigeonpea", "Black Gram"],
        trees: ["Teak", "Bamboo", "Sal"]
      },
      "Odisha": {
        mainCrops: ["Rice", "Maize", "Groundnut", "Sugarcane"],
        intercrops: ["Pigeonpea", "Green Gram", "Black Gram"],
        trees: ["Mango", "Neem", "Bamboo"]
      },
      "Karnataka": {
        mainCrops: ["Jowar", "Rice", "Maize", "Groundnut"],
        intercrops: ["Pigeonpea", "Groundnut", "Cowpea"],
        trees: ["Neem", "Mango", "Tamarind"]
      },
      "Telangana": {
        mainCrops: ["Rice", "Cotton", "Maize", "Jowar"],
        intercrops: ["Pigeonpea", "Black Gram", "Groundnut"],
        trees: ["Neem", "Tamarind", "Mango"]
      },
      "Andhra Pradesh": {
        mainCrops: ["Rice", "Maize", "Cotton", "Groundnut"],
        intercrops: ["Pigeonpea", "Black Gram", "Green Gram"],
        trees: ["Mango", "Coconut", "Neem"]
      },
      "Tamil Nadu": {
        mainCrops: ["Rice", "Sugarcane", "Maize", "Cotton"],
        intercrops: ["Groundnut", "Black Gram", "Green Gram"],
        trees: ["Coconut", "Mango", "Neem"]
      },
      "Kerala": {
        mainCrops: ["Coconut", "Rice", "Sugarcane", "Maize"],
        intercrops: ["Cowpea", "Green Gram", "Groundnut"],
        trees: ["Coconut", "Bamboo", "Mango"]
      },
      "West Bengal": {
        mainCrops: ["Rice", "Wheat", "Maize", "Sugarcane"],
        intercrops: ["Lentils", "Chickpea", "Cowpea"],
        trees: ["Mango", "Bamboo", "Neem"]
      },
      "Assam/Northeast": {
        mainCrops: ["Rice", "Maize", "Sugarcane", "Jowar"],
        intercrops: ["Black Gram", "Green Gram", "Cowpea"],
        trees: ["Bamboo", "Mango", "Neem"]
      },
      "India": {
        mainCrops: ["Maize", "Rice", "Wheat", "Soyabean"],
        intercrops: ["Cowpea", "Black Gram", "Pigeonpea"],
        trees: ["Neem", "Mango", "Gliricidia"]
      },
      "Global": {
        mainCrops: ["Maize", "Rice", "Wheat", "Soyabean"],
        intercrops: ["Cowpea", "Lentils", "Pigeonpea"],
        trees: ["Neem", "Mango", "Gliricidia"]
      }
    };
  }
  
  getSoilRecommendation(ph, organic_carbon, texture, nitrogen, cec) {
    let recommendation = "";
    
    if (ph != null) {
      if (ph < 6.0) {
        recommendation += "Soil is acidic. Add lime to raise pH. ";
      } else if (ph > 7.5) {
        recommendation += "Soil is alkaline. Add organic matter to lower pH. ";
      } else {
        recommendation += "Soil pH is optimal for most crops. ";
      }
    }
    
    if (organic_carbon != null) {
      if (organic_carbon < 1.0) {
        recommendation += "Low organic matter. Add compost or manure. ";
      } else {
        recommendation += "Good organic matter content. ";
      }
    }
    
    if (nitrogen != null && nitrogen < 150) {
      recommendation += "Low nitrogen. Include nitrogen-fixing crops. ";
    }
    
    if (texture) {
      recommendation += `Ideal for ${texture.toLowerCase()} soil crops.`;
    }
    
    return recommendation || "Soil data is being analyzed. General recommendations apply.";
  }
  
  getClimateRecommendation(rainfall, temperature, solar) {
    let recommendation = "";
    
    if (rainfall < 500) {
      recommendation += "Arid conditions. Focus on drought-resistant crops. ";
    } else if (rainfall > 1500) {
      recommendation += "High rainfall area. Ensure good drainage. ";
    } else {
      recommendation += "Moderate rainfall suitable for diverse crops. ";
    }
    
    if (temperature < 20) {
      recommendation += "Cool climate. Suitable for winter crops. ";
    } else if (temperature > 35) {
      recommendation += "Hot climate. Focus on heat-tolerant varieties. ";
    } else {
      recommendation += "Temperature suitable for year-round cultivation. ";
    }
    
    if (solar > 6) {
      recommendation += "High solar radiation - suitable for sun-loving crops. ";
    }
    
    return recommendation.trim();
  }

  // Method to submit farmer feedback
  async submitFeedback(predictionId, feedbackData) {
    try {
      // Try Firebase first
      const feedbackId = await continuousLearningService.storeFeedback(predictionId, feedbackData);
      console.log('Feedback submitted to Firebase with ID:', feedbackId);
      return feedbackId;
    } catch (firebaseError) {
      console.warn('Firebase feedback storage failed, saving locally:', firebaseError.message);
      
      // Fallback: store feedback in localStorage when Firebase is unavailable
      try {
        const localFeedbackId = `local-fb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const storedFeedback = JSON.parse(localStorage.getItem('digitalRaitha_feedback') || '[]');
        storedFeedback.push({
          id: localFeedbackId,
          prediction_id: predictionId,
          ...feedbackData,
          stored_locally: true,
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('digitalRaitha_feedback', JSON.stringify(storedFeedback));
        console.log('Feedback saved locally with ID:', localFeedbackId);
        return localFeedbackId;
      } catch (localError) {
        console.error('Error saving feedback locally:', localError);
        throw localError;
      }
    }
  }
}

export default new AgroIntelService();