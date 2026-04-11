# Digital Raitha AI Model Development Guide

## Overview

This guide explains how to develop and deploy AI models for the Digital Raitha agricultural advisory system using these datasets:
1. NASA POWER data (Rainfall, Temperature, Humidity, Radiation)
2. Crop price data
3. All India level Area Under Principal Crops (2001-02 to 2015-16)
4. All India level Average Yield of Principal Crops (2001-02 to 2015-16)
5. Production of principal crops
6. Disaster damage data

## Repository Structure

```
models/
├── api/                   # API endpoints
├── map_visualization/     # Map generation and visualization logic
├── preprocessing/         # Data preprocessing utilities
├── recommendation/        # Recommendation engine
├── training/              # Model training scripts
├── saved_models/          # Saved trained model files
├── requirements.txt       # Python dependencies for models
└── README.md              # Models README

notebooks/
└── model_development.ipynb  # Jupyter notebook for model development

data/
├── 1. NASA POWER Data (Rainfall, Temperature, Humidity, Radiation) 👆🏻.csv
├── price.csv
├── Production of principle crops.csv
├── All India level Area Under Principal Crops from 2001-02 to 2015-16.csv
├── All India level Average Yield of Principal Crops from 2001-02 to 2015-16.csv
├── Year-wise Damage Caused Due To Floods, Cyclonic Storm, Landslides etc.csv
├── analyze_historical_datasets.py
├── process_historical_datasets.py
└── test_dataset_processing.py
```

## Setting Up the Environment

1. Install Python 3.8 or higher.
2. Install required packages:
   ```bash
   pip install -r models/requirements.txt
   ```

## Data Preparation

### 1. NASA POWER Data
- Place your NASA POWER CSV file in `data/`
- Expected columns include: `T2M`, `RH2M`, `PRECTOTCORR`, `ALLSKY_SFC_SW_DWN`

### 2. Crop Price Data
- Place your crop price CSV file in `data/`
- Expected columns may include: `YEAR`, crop price columns like `MANGO_PRICE`, `RICE_PRICE`, etc.

### 3. Crop Area Data
- Place your crop area CSV file in `data/`
- Expected columns may include: `Year`, crop area columns, or principal crop area values

### 4. Crop Yield Data
- Place your crop yield CSV file in `data/`
- Expected columns may include: `Year`, crop yield columns, or principal crop yield values

### 5. Production Data
- Place your production CSV file in `data/`
- Expected columns may include: `Year`, crop production columns, or principal crop production values

### 6. Damage Data
- Place the disaster damage CSV file in `data/`
- Expected columns may include: `Flood`, `Cyclone`, `Landslide`, and `Year`

## Model Development Process

### 1. Data Preprocessing
Use the `AgriDataPreprocessor` class in `models/preprocessing/data_processor.py`:

```python
from preprocessing.data_processor import AgriDataPreprocessor

preprocessor = AgriDataPreprocessor()

# Load and preprocess datasets
nasa_data = preprocessor.load_nasa_power_data('data/1. NASA POWER Data (Rainfall, Temperature, Humidity, Radiation) 👆🏻.csv')
price_data = preprocessor.load_crop_price_data('data/price.csv')
yield_data = preprocessor.load_yield_data('data/All India level Average Yield of Principal Crops from 2001-02 to 2015-16.csv')
area_data = preprocessor.load_area_data('data/All India level Area Under Principal Crops from 2001-02 to 2015-16.csv')
production_data = preprocessor.load_production_data('data/Production of principle crops.csv')
damage_data = preprocessor.load_damage_data('data/Year-wise Damage Caused Due To Floods, Cyclonic Storm, Landslides etc.csv')

# Create features for training
features = preprocessor.prepare_crop_data_for_merging(yield_data, 'yield')
```

> Note: The project data files are stored directly under `data/` in the current repository.

### 2. Model Training
Use the model training scripts in `models/training/`:

```python
from training.model_trainer import AgriYieldModel, AgriROIModel

# Initialize models
yield_model = AgriYieldModel()
roi_model = AgriROIModel()

# Prepare features and targets from preprocessor results
X, y_yield = preprocessor.prepare_model_data(features, target_column='yield')
X, y_roi = preprocessor.prepare_model_data(features, target_column='roi')

# Train models
yield_metrics = yield_model.train({'features': X})
roi_metrics = roi_model.train({'features': X})

# Save models
yield_model.save_model('saved_models/yield_model')
roi_model.save_model('saved_models/roi_model')
```

> The exact training flow may vary depending on your dataset and the feature preparation you implement.

### 3. Recommendation Engine
The recommendation engine in `models/recommendation/engine.py` combines crop rules, weather, and economic data:

```python
from recommendation.engine import AgriRecommendationEngine, SoilData, WeatherData, EconomicData

engine = AgriRecommendationEngine()

soil_data = SoilData(ph=6.7, organic_carbon=1.2, nitrogen=150, phosphorus=40, potassium=200, texture='Loam', drainage='Moderate')
weather_data = WeatherData(rainfall_mm=850, temperature_c=28, humidity=65, solar_radiation=5.5)
economic_data = EconomicData(budget_inr=60000, labor_availability='Medium', input_cost_type='Organic')

recommendation = engine.generate_recommendation(soil_data, weather_data, economic_data, 5.0, 'Belagavi, Karnataka')
```

### 4. API Deployment
Run the API server:

```bash
python models/api/app.py
```

The API will be available at `http://localhost:5000` with the following endpoints:
- `GET /health` - Health check
- `POST /predict/yield` - Predict crop yield
- `POST /predict/roi` - Predict return on investment
- `POST /recommend` - Generate recommendations
- `POST /preprocess` - Preprocess agricultural data

## Using Your Datasets

### Step 1: Data Integration
1. Place your CSV files in the `data/` directory.
2. Update the data loading functions in `models/preprocessing/data_processor.py` to match your CSV structure.
3. Ensure consistent column names and data types.

### Step 2: Feature Engineering
Modify the preprocessing functions in `models/preprocessing/data_processor.py` to:
1. Extract relevant features from your datasets
2. Handle missing values appropriately
3. Normalize or standardize numerical features
4. Encode categorical variables where needed

### Step 3: Model Training
1. Load your datasets using the preprocessor.
2. Create feature matrices and target values.
3. Split data into training and testing sets.
4. Train the models using your data.
5. Evaluate performance with metrics like RMSE and R².
6. Save trained models to `models/saved_models/`.

### Step 4: Model Deployment
1. Update `models/api/app.py` to load your trained models.
2. Test the API with sample requests.
3. Deploy to a server or cloud platform.

## Example Usage

See `notebooks/model_development.ipynb` for a complete example of how to:
1. Load and preprocess your datasets
2. Train machine learning models
3. Generate agricultural recommendations
4. Evaluate performance

## Next Steps

1. Replace sample data with your actual datasets.
2. Fine-tune model hyperparameters for better performance.
3. Add more features from your datasets.
4. Implement cross-validation for robust evaluation.
5. Deploy the API to production.
6. Integrate with the Digital Raitha frontend.

## Troubleshooting

### Common Issues
1. **Missing Data**: Use forward-fill/backward-fill or interpolation.
2. **Inconsistent Formats**: Standardize dates, numeric formats, and column names.
3. **Memory Issues**: Process large datasets in chunks or sample data.
4. **Performance**: Optimize feature engineering and use efficient data structures.

### Getting Help
If you encounter issues:
1. Check console output for errors.
2. Verify your data files are in the correct format.
3. Ensure required dependencies are installed.
4. Consult library documentation and repository scripts.
